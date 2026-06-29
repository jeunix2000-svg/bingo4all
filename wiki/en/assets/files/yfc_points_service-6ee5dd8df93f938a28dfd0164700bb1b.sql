-- =====================================================================
--  YFC 社内Wiki ポイント・マイクロサービス
--  Data Model + Scoring Rules  (PostgreSQL 14+)
-- ---------------------------------------------------------------------
--  设计要点 / 設計方針：
--   1. point_events 为「追加专用台帳(append-only ledger)」= 唯一真相来源。
--      所有积分变动只追加、不修改/删除 → ISMS/監査ログ友好、可完全回溯。
--   2. 余额(user_point_balance) / 信誉(domain_reputation) 为派生聚合，
--      由 award_points() 在写入台帳的同一事务内同步更新。
--   3. 防刷分(anti-gaming)：自赞禁止 / 日次上限 / 评价者信誉加权 /
--      互赞环检测 / 低质惩罚。规则数据化(point_rule)，可热调整不改代码。
--   4. 质 > 量：基础点低，主体得分来自他者评价・采纳・被参照。
-- =====================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS points;
SET search_path TO points, public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- 大小写无关 email


-- =====================================================================
--  A. マスタ / 参照テーブル (lookup tables)
-- =====================================================================

-- A-1. 用户区分（社员 / 社内常驻(BP) など）
CREATE TABLE user_type (
    code         TEXT PRIMARY KEY,                 -- 'EMPLOYEE' | 'PARTNER'
    label_ja     TEXT NOT NULL,
    can_view_mgmt BOOLEAN NOT NULL DEFAULT FALSE   -- 経営・人事カテゴリ閲覧可否
);

-- A-2. 内容类别（技术 / 业务 / 管理 / 顾客业种知见）— 兼作「领域信誉」的単位
CREATE TABLE category (
    code      TEXT PRIMARY KEY,                    -- 'TECH' | 'BIZ' | 'MGMT' | 'DOMAIN'
    label_ja  TEXT NOT NULL,
    parent_code TEXT REFERENCES category(code),    -- 二级分类（例：TECH > LEGACY/AI/INFRA）
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- A-3. 投稿方式
CREATE TABLE post_type (
    code     TEXT PRIMARY KEY,   -- 'SHARE'|'QUESTION'|'REVIEW_ITEM'|'HOWTO'|'POSTMORTEM'|'BEST_PRACTICE'
    label_ja TEXT NOT NULL
);

-- A-4. 等级(level) 阈值
CREATE TABLE level_def (
    level_no     SMALLINT PRIMARY KEY,             -- 1..5
    code         TEXT UNIQUE NOT NULL,             -- 'APPRENTICE'..'MEISTER'
    label_ja     TEXT NOT NULL,
    min_points   INTEGER NOT NULL                  -- 达到该等级的最低累计积分
);

-- A-5. 徽章(badge) 定义
CREATE TABLE badge_def (
    code         TEXT PRIMARY KEY,                 -- 'FIRST_POST' | 'SAVIOR' ...
    label_ja     TEXT NOT NULL,
    description  TEXT,
    -- 触发条件类型：达到某计数 / 满足SQL条件，由 badge 引擎评估
    trigger_kind TEXT NOT NULL DEFAULT 'COUNTER',  -- 'COUNTER' | 'CUSTOM'
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- A-6. ★采点規則（数据化，热调整核心）★
CREATE TABLE point_rule (
    rule_code     TEXT PRIMARY KEY,                -- 'POST_CREATE' 等
    label_ja      TEXT NOT NULL,
    base_points   INTEGER NOT NULL,                -- 基础点（可为负=惩罚）
    -- 受益者：行为人自身(SELF) 还是 被作用内容的作者(TARGET_AUTHOR)
    beneficiary   TEXT NOT NULL DEFAULT 'SELF'
                    CHECK (beneficiary IN ('SELF','TARGET_AUTHOR')),
    -- 是否参与「评价者信誉加权」
    weighted_by_reputation BOOLEAN NOT NULL DEFAULT FALSE,
    -- 日次上限：单用户单规则每日最多获得的次数（NULL=无限）
    daily_cap_count INTEGER,
    -- 该规则是否禁止自我作用（自赞/自采纳）
    forbid_self_action BOOLEAN NOT NULL DEFAULT TRUE,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================================================================
--  B. アイデンティティ / コンテンツ・ミラー
--     (内容主体存于 Wiki 端；此处只镜像采点所需的最小信息)
-- =====================================================================

-- B-1. 用户（来自 Entra ID 同步，不自管密码）
CREATE TABLE app_user (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entra_oid     TEXT UNIQUE NOT NULL,            -- Entra ID object id (SSOキー)
    email         CITEXT UNIQUE NOT NULL,
    display_name  TEXT NOT NULL,
    user_type     TEXT NOT NULL REFERENCES user_type(code),
    department    TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B-2. 投稿镜像
CREATE TABLE post (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wiki_ref      TEXT UNIQUE NOT NULL,            -- Wiki側の記事ID
    author_id     UUID NOT NULL REFERENCES app_user(id),
    title         TEXT NOT NULL,
    category_code TEXT NOT NULL REFERENCES category(code),
    post_type     TEXT NOT NULL REFERENCES post_type(code),
    confidentiality TEXT NOT NULL DEFAULT 'INTERNAL'
                    CHECK (confidentiality IN ('PUBLIC','INTERNAL','DEPT')),
    -- 缓存计数（由台帳派生，便于查询；非真相来源）
    upvote_count    INTEGER NOT NULL DEFAULT 0,
    downvote_count  INTEGER NOT NULL DEFAULT 0,
    reference_count INTEGER NOT NULL DEFAULT 0,
    is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,  -- QUESTION 是否已有 best answer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_author   ON post(author_id);
CREATE INDEX idx_post_category ON post(category_code);
CREATE INDEX idx_post_unresolved ON post(post_type, is_resolved)
    WHERE post_type = 'QUESTION' AND is_resolved = FALSE;

-- B-3. 贡献（回答 / 补足）镜像
CREATE TABLE contribution (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id       UUID NOT NULL REFERENCES post(id),
    author_id     UUID NOT NULL REFERENCES app_user(id),
    kind          TEXT NOT NULL CHECK (kind IN ('ANSWER','SUPPLEMENT')),
    is_accepted   BOOLEAN NOT NULL DEFAULT FALSE,  -- ベストアンサー / 采纳
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contrib_post   ON contribution(post_id);
CREATE INDEX idx_contrib_author ON contribution(author_id);


-- =====================================================================
--  C. 评价 / 投票（防刷分的关键作用面）
-- =====================================================================

-- C-1. 投票（いいね / 低评价）。唯一约束 → 一人一票，且禁自票
CREATE TABLE vote (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id    UUID NOT NULL REFERENCES app_user(id),
    post_id     UUID NOT NULL REFERENCES post(id),
    direction   SMALLINT NOT NULL CHECK (direction IN (-1, 1)),  -- 1=赞 / -1=踩
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (voter_id, post_id)                    -- 同一人对同一帖只能一票
);
CREATE INDEX idx_vote_post ON vote(post_id);

-- C-2. 多维价值评价（实用性 / 正确性 / 新规性，1..5）
CREATE TABLE value_rating (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_id    UUID NOT NULL REFERENCES app_user(id),
    post_id     UUID NOT NULL REFERENCES post(id),
    usefulness  SMALLINT NOT NULL CHECK (usefulness BETWEEN 1 AND 5),
    accuracy    SMALLINT NOT NULL CHECK (accuracy  BETWEEN 1 AND 5),
    novelty     SMALLINT NOT NULL CHECK (novelty   BETWEEN 1 AND 5),
    helpful_marks INTEGER NOT NULL DEFAULT 0,      -- 该评价被认为有帮助的次数
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (rater_id, post_id)
);


-- =====================================================================
--  D. ★積分台帳(ledger) — 追加専用・真相来源★
-- =====================================================================
CREATE TABLE point_event (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- 受益者（积分进谁账）
    user_id       UUID NOT NULL REFERENCES app_user(id),
    -- 触发该事件的行为人（可能 = user_id，例如自己投稿）
    actor_id      UUID REFERENCES app_user(id),
    rule_code     TEXT NOT NULL REFERENCES point_rule(rule_code),
    points        INTEGER NOT NULL,                -- 实际入账分（已含权重/正负）
    -- 关联对象（用于回溯 & 防重复）
    ref_type      TEXT NOT NULL,                   -- 'POST'|'CONTRIBUTION'|'VOTE'|'RATING'
    ref_id        UUID NOT NULL,
    category_code TEXT REFERENCES category(code),  -- 用于领域信誉累计
    weight        NUMERIC(4,2) NOT NULL DEFAULT 1.00,  -- 实际应用的权重(审计用)
    metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- 防止同一(规则,对象,受益者)重复入账（如重复回调）
    UNIQUE (rule_code, ref_type, ref_id, user_id)
);
CREATE INDEX idx_pe_user      ON point_event(user_id);
CREATE INDEX idx_pe_user_day  ON point_event(actor_id, rule_code, created_at);
CREATE INDEX idx_pe_category  ON point_event(user_id, category_code);


-- =====================================================================
--  E. 派生集計 (derived aggregates)
-- =====================================================================

-- E-1. 用户余额 / 等级
CREATE TABLE user_point_balance (
    user_id       UUID PRIMARY KEY REFERENCES app_user(id),
    total_points  INTEGER NOT NULL DEFAULT 0,
    level_no      SMALLINT NOT NULL DEFAULT 1 REFERENCES level_def(level_no),
    last_event_at TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E-2. 领域信誉（专家认定的依据）。某领域得分越高 → 其「检证」权重越大
CREATE TABLE user_domain_reputation (
    user_id       UUID NOT NULL REFERENCES app_user(id),
    category_code TEXT NOT NULL REFERENCES category(code),
    reputation    INTEGER NOT NULL DEFAULT 0,
    is_verifier   BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否获得该领域「检证者」资格
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, category_code)
);

-- E-3. 获得的徽章
CREATE TABLE user_badge (
    user_id     UUID NOT NULL REFERENCES app_user(id),
    badge_code  TEXT NOT NULL REFERENCES badge_def(code),
    awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, badge_code)
);

-- E-4. 反操纵告警（互赞环 / 异常集中），人工复核用
CREATE TABLE gaming_alert (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kind        TEXT NOT NULL,                     -- 'MUTUAL_VOTE_RING'|'BURST'
    user_a      UUID REFERENCES app_user(id),
    user_b      UUID REFERENCES app_user(id),
    detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed    BOOLEAN NOT NULL DEFAULT FALSE
);


-- =====================================================================
--  F. 種データ (seed)
-- =====================================================================
INSERT INTO user_type(code,label_ja,can_view_mgmt) VALUES
  ('EMPLOYEE','正社員',TRUE),
  ('PARTNER','社内常駐／協力会社',FALSE);

INSERT INTO category(code,label_ja,parent_code) VALUES
  ('TECH','技術',NULL),('BIZ','業務',NULL),
  ('MGMT','管理',NULL),('DOMAIN','顧客業種知見',NULL);
INSERT INTO category(code,label_ja,parent_code) VALUES
  ('LEGACY','レガシー(COBOL/JCL)','TECH'),
  ('AI','AI/LLM','TECH'),
  ('INFRA','インフラ','TECH');

INSERT INTO post_type(code,label_ja) VALUES
  ('SHARE','経験共有'),('QUESTION','疑問提起'),('REVIEW_ITEM','検討事項'),
  ('HOWTO','手順書'),('POSTMORTEM','失敗事例'),('BEST_PRACTICE','ベストプラクティス');

INSERT INTO level_def(level_no,code,label_ja,min_points) VALUES
  (1,'APPRENTICE','見習い',0),
  (2,'REGULAR','一般',100),
  (3,'SENIOR','上級',400),
  (4,'EXPERT','エキスパート',1200),
  (5,'MEISTER','マイスター',3000);

INSERT INTO badge_def(code,label_ja,description) VALUES
  ('FIRST_POST','初投稿','初めての投稿'),
  ('STREAK','連続投稿','一定期間の継続投稿'),
  ('SAVIOR','救世主','多数の疑問を解決'),
  ('GUARDIAN','知識の番人','常緑かつ高評価の記事を保有'),
  ('REVIEWER','レビュー職人','質の高い評価を多数提供'),
  ('LEARN_FROM_FAIL','失敗から学ぶ','良質な失敗事例(ポストモーテム)を投稿');

-- ★ 采点规则：基础点低、回报集中在「有用」与「流通」、惩罚水増し ★
INSERT INTO point_rule
  (rule_code,label_ja,base_points,beneficiary,weighted_by_reputation,daily_cap_count,forbid_self_action) VALUES
  ('POST_CREATE',       '投稿',                5,'SELF',         FALSE, 5, FALSE),
  ('POST_UPVOTED',      '投稿に+1評価',         1,'TARGET_AUTHOR',TRUE, 50,TRUE),
  ('POST_DOWNVOTED',    '投稿に-1評価(惩罚)',  -3,'TARGET_AUTHOR',FALSE,20,TRUE),
  ('POST_REFERENCED',   '投稿が被参照',         3,'TARGET_AUTHOR',FALSE,NULL,TRUE),
  ('ANSWER_CREATE',     '疑問への回答',         3,'SELF',         FALSE,10,FALSE),
  ('ANSWER_ACCEPTED',   '回答が採択',          15,'TARGET_AUTHOR',FALSE,NULL,TRUE),
  ('SUPPLEMENT_CREATE', '有効な補足',           2,'SELF',         FALSE,10,FALSE),
  ('SUPPLEMENT_ACCEPTED','補足が採択',          8,'TARGET_AUTHOR',FALSE,NULL,TRUE),
  ('REVIEW_GIVEN',      '誠実な評価を提供',     1,'SELF',         FALSE,15,FALSE),
  ('REVIEW_HELPFUL',    '評価が有用と認定',     2,'TARGET_AUTHOR',FALSE,NULL,TRUE),
  ('BEST_PRACTICE_BONUS','ベストプラクティス採用ボーナス',10,'TARGET_AUTHOR',FALSE,NULL,TRUE);


-- =====================================================================
--  G. コア関数：award_points()  ★采点核心★
--  在写入台帳的同一事务内：① 防刷分校验 ② 计权 ③ 入账 ④ 更新余额/信誉
--  返回实际入账分；若被防刷分拦截则返回 0。
-- =====================================================================
CREATE OR REPLACE FUNCTION award_points(
    p_rule_code     TEXT,
    p_actor_id      UUID,          -- 行为人
    p_target_author UUID,          -- 被作用内容作者（POST_UPVOTED 等用）
    p_ref_type      TEXT,
    p_ref_id        UUID,
    p_category_code TEXT DEFAULT NULL,
    p_metadata      JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
DECLARE
    r              point_rule%ROWTYPE;
    v_beneficiary  UUID;
    v_weight       NUMERIC(4,2) := 1.00;
    v_points       INTEGER;
    v_used_today   INTEGER;
    v_rep          INTEGER;
    v_new_total    INTEGER;
    v_new_level    SMALLINT;
BEGIN
    -- (1) 取规则；停用规则不入账
    SELECT * INTO r FROM point_rule WHERE rule_code = p_rule_code AND is_active;
    IF NOT FOUND THEN RETURN 0; END IF;

    -- (2) 决定受益者
    v_beneficiary := CASE r.beneficiary
                        WHEN 'SELF' THEN p_actor_id
                        ELSE p_target_author END;
    IF v_beneficiary IS NULL THEN RETURN 0; END IF;

    -- (3) 防刷分①：禁止自我作用（自赞/自采纳/自参照）
    IF r.forbid_self_action AND p_actor_id IS NOT NULL
       AND p_actor_id = v_beneficiary THEN
        RETURN 0;
    END IF;

    -- (4) 防刷分②：日次上限（按 行为人 + 规则 + 当日 计次）
    IF r.daily_cap_count IS NOT NULL AND p_actor_id IS NOT NULL THEN
        SELECT count(*) INTO v_used_today
        FROM point_event
        WHERE actor_id = p_actor_id
          AND rule_code = p_rule_code
          AND created_at >= date_trunc('day', now());
        IF v_used_today >= r.daily_cap_count THEN
            RETURN 0;       -- 超过当日上限，静默丢弃（抑制水増し）
        END IF;
    END IF;

    -- (5) 评价者信誉加权（高信誉者的赞，权重更高；新人/低信誉打折）
    IF r.weighted_by_reputation AND p_actor_id IS NOT NULL AND p_category_code IS NOT NULL THEN
        SELECT reputation INTO v_rep
        FROM user_domain_reputation
        WHERE user_id = p_actor_id AND category_code = p_category_code;
        v_rep := COALESCE(v_rep, 0);
        -- 0.5〜1.5 区间：信誉0→0.5，信誉≥1000→1.5
        v_weight := LEAST(1.50, 0.50 + (v_rep::NUMERIC / 1000.0));
    END IF;

    v_points := round(r.base_points * v_weight)::INTEGER;
    IF v_points = 0 THEN RETURN 0; END IF;

    -- (6) 入账台帳（UNIQUE 防重复；冲突则视为已处理，返回0）
    INSERT INTO point_event
        (user_id, actor_id, rule_code, points, ref_type, ref_id, category_code, weight, metadata)
    VALUES
        (v_beneficiary, p_actor_id, p_rule_code, v_points, p_ref_type, p_ref_id,
         p_category_code, v_weight, p_metadata)
    ON CONFLICT (rule_code, ref_type, ref_id, user_id) DO NOTHING;

    IF NOT FOUND THEN RETURN 0; END IF;   -- 重复回调，已存在

    -- (7) 更新余额 + 等级
    INSERT INTO user_point_balance(user_id, total_points, last_event_at)
    VALUES (v_beneficiary, v_points, now())
    ON CONFLICT (user_id) DO UPDATE
        SET total_points  = user_point_balance.total_points + EXCLUDED.total_points,
            last_event_at = now(),
            updated_at    = now()
    RETURNING total_points INTO v_new_total;

    SELECT max(level_no) INTO v_new_level
    FROM level_def WHERE min_points <= GREATEST(v_new_total, 0);
    UPDATE user_point_balance
        SET level_no = COALESCE(v_new_level, 1)
        WHERE user_id = v_beneficiary;

    -- (8) 更新领域信誉（仅正分计入信誉，避免被踩拉低信誉造成寒蝉效应）
    IF p_category_code IS NOT NULL AND v_points > 0 THEN
        INSERT INTO user_domain_reputation(user_id, category_code, reputation)
        VALUES (v_beneficiary, p_category_code, v_points)
        ON CONFLICT (user_id, category_code) DO UPDATE
            SET reputation = user_domain_reputation.reputation + EXCLUDED.reputation,
                updated_at = now();
        -- 领域信誉≥800 自动授予「检证者」资格（信任飞轮）
        UPDATE user_domain_reputation
            SET is_verifier = TRUE
            WHERE user_id = v_beneficiary AND category_code = p_category_code
              AND reputation >= 800 AND is_verifier = FALSE;
    END IF;

    RETURN v_points;
END;
$$;


-- =====================================================================
--  H. トリガ関数：从业务事件自动驱动采点
-- =====================================================================

-- H-1. 投稿创建 → POST_CREATE（含失败事例额外徽章资格在 badge 引擎处理）
CREATE OR REPLACE FUNCTION trg_post_insert() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
BEGIN
    PERFORM award_points('POST_CREATE', NEW.author_id, NEW.author_id,
                         'POST', NEW.id, NEW.category_code,
                         jsonb_build_object('post_type', NEW.post_type));
    RETURN NEW;
END;
$$;
CREATE TRIGGER post_after_insert AFTER INSERT ON post
    FOR EACH ROW EXECUTE FUNCTION trg_post_insert();

-- H-2. 投票 → 更新缓存计数 + 采点（赞给作者加分 / 踩做惩罚）+ 互赞检测
CREATE OR REPLACE FUNCTION trg_vote_insert() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
DECLARE
    v_author UUID;
    v_cat    TEXT;
    v_recip  INTEGER;
BEGIN
    SELECT author_id, category_code INTO v_author, v_cat FROM post WHERE id = NEW.post_id;

    -- 自票由 vote 触发器前置拦截（见 H-2b），此处只处理他票
    IF NEW.direction = 1 THEN
        UPDATE post SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
        PERFORM award_points('POST_UPVOTED', NEW.voter_id, v_author,
                             'VOTE', NEW.id, v_cat);
    ELSE
        UPDATE post SET downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
        PERFORM award_points('POST_DOWNVOTED', NEW.voter_id, v_author,
                             'VOTE', NEW.id, v_cat);
    END IF;

    -- 互赞环检测：对方近30天是否也给我点过赞 → 双向超阈值则告警
    IF NEW.direction = 1 THEN
        SELECT count(*) INTO v_recip
        FROM vote vv
        JOIN post pp ON pp.id = vv.post_id
        WHERE vv.voter_id = v_author          -- 对方
          AND pp.author_id = NEW.voter_id     -- 投给「我」的帖
          AND vv.direction = 1
          AND vv.created_at >= now() - INTERVAL '30 days';
        IF v_recip >= 5 THEN
            INSERT INTO gaming_alert(kind, user_a, user_b, detail)
            VALUES ('MUTUAL_VOTE_RING', NEW.voter_id, v_author,
                    jsonb_build_object('reciprocal_upvotes', v_recip));
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER vote_after_insert AFTER INSERT ON vote
    FOR EACH ROW EXECUTE FUNCTION trg_vote_insert();

-- H-2b. 自票硬性拦截（DB层最后防线，应用层也应拦）
CREATE OR REPLACE FUNCTION trg_vote_no_self() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
DECLARE v_author UUID;
BEGIN
    SELECT author_id INTO v_author FROM post WHERE id = NEW.post_id;
    IF v_author = NEW.voter_id THEN
        RAISE EXCEPTION '自己の投稿には投票できません (self-vote forbidden)';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER vote_before_insert BEFORE INSERT ON vote
    FOR EACH ROW EXECUTE FUNCTION trg_vote_no_self();

-- H-3. 贡献被采纳 → ANSWER_ACCEPTED / SUPPLEMENT_ACCEPTED，并关闭疑问
CREATE OR REPLACE FUNCTION trg_contrib_update() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
DECLARE
    v_post   post%ROWTYPE;
    v_rule   TEXT;
BEGIN
    IF NEW.is_accepted AND NOT OLD.is_accepted THEN
        SELECT * INTO v_post FROM post WHERE id = NEW.post_id;
        v_rule := CASE NEW.kind WHEN 'ANSWER' THEN 'ANSWER_ACCEPTED'
                                ELSE 'SUPPLEMENT_ACCEPTED' END;
        -- 采纳由「提问者/レビュア」操作：actor=帖主，beneficiary=贡献作者
        PERFORM award_points(v_rule, v_post.author_id, NEW.author_id,
                             'CONTRIBUTION', NEW.id, v_post.category_code);
        -- 回答被采纳 → 疑问标记已解决
        IF NEW.kind = 'ANSWER' THEN
            UPDATE post SET is_resolved = TRUE WHERE id = NEW.post_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER contrib_after_update AFTER UPDATE ON contribution
    FOR EACH ROW EXECUTE FUNCTION trg_contrib_update();

-- H-4. 贡献创建 → ANSWER_CREATE / SUPPLEMENT_CREATE
CREATE OR REPLACE FUNCTION trg_contrib_insert() RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
DECLARE v_cat TEXT; v_rule TEXT;
BEGIN
    SELECT category_code INTO v_cat FROM post WHERE id = NEW.post_id;
    v_rule := CASE NEW.kind WHEN 'ANSWER' THEN 'ANSWER_CREATE'
                            ELSE 'SUPPLEMENT_CREATE' END;
    PERFORM award_points(v_rule, NEW.author_id, NEW.author_id,
                         'CONTRIBUTION', NEW.id, v_cat);
    RETURN NEW;
END;
$$;
CREATE TRIGGER contrib_after_insert AFTER INSERT ON contribution
    FOR EACH ROW EXECUTE FUNCTION trg_contrib_insert();


-- =====================================================================
--  I. ビュー (运用 / 可視化)
-- =====================================================================

-- I-1. 全社排行榜（等级 + 主领域）
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT u.id, u.display_name, u.department,
       b.total_points, ld.label_ja AS level_label,
       (SELECT category_code FROM user_domain_reputation r
         WHERE r.user_id = u.id ORDER BY reputation DESC LIMIT 1) AS top_domain,
       rank() OVER (ORDER BY b.total_points DESC) AS rank
FROM app_user u
JOIN user_point_balance b ON b.user_id = u.id
JOIN level_def ld ON ld.level_no = b.level_no
WHERE u.is_active
ORDER BY b.total_points DESC;

-- I-2. ★ナレッジ・ギャップ★：被频繁提问但无良质回答的领域
--     （质问多、解决率低 → 组织该补的知识盲点）
CREATE OR REPLACE VIEW v_knowledge_gap AS
SELECT c.code AS category_code, c.label_ja,
       count(*) FILTER (WHERE p.post_type='QUESTION')                              AS question_total,
       count(*) FILTER (WHERE p.post_type='QUESTION' AND NOT p.is_resolved)        AS unresolved,
       round(100.0 * count(*) FILTER (WHERE p.post_type='QUESTION' AND p.is_resolved)
             / NULLIF(count(*) FILTER (WHERE p.post_type='QUESTION'),0), 1)        AS resolved_rate_pct
FROM category c
LEFT JOIN post p ON p.category_code = c.code
GROUP BY c.code, c.label_ja
HAVING count(*) FILTER (WHERE p.post_type='QUESTION') > 0
ORDER BY unresolved DESC, resolved_rate_pct ASC;

-- I-3. 个人投稿统计（投稿数 / 分类别 / 累计获赞 / 积分）
CREATE OR REPLACE VIEW v_user_stats AS
SELECT u.id, u.display_name,
       count(DISTINCT p.id)                              AS post_count,
       coalesce(sum(p.upvote_count),0)                   AS upvotes_received,
       coalesce(b.total_points,0)                        AS total_points,
       coalesce(b.level_no,1)                            AS level_no,
       (SELECT count(*) FROM contribution co
         WHERE co.author_id=u.id AND co.is_accepted)     AS accepted_contribs,
       (SELECT count(*) FROM user_badge ub WHERE ub.user_id=u.id) AS badge_count
FROM app_user u
LEFT JOIN post p ON p.author_id = u.id
LEFT JOIN user_point_balance b ON b.user_id = u.id
GROUP BY u.id, u.display_name, b.total_points, b.level_no;

-- I-4. 全社统计ダッシュボード（投稿方式・类别の分布）
CREATE OR REPLACE VIEW v_org_stats AS
SELECT category_code, post_type,
       count(*)                                          AS total,
       sum(upvote_count)                                 AS upvotes,
       count(*) FILTER (WHERE post_type='QUESTION' AND is_resolved) AS resolved_q
FROM post
GROUP BY category_code, post_type;


-- =====================================================================
--  J. 月次バッチ：常緑コンテンツ加点（长期复利）
--    被持续参照/高赞的「常緑」记事，每月给作者追加复利分。
--    应用层每月调用一次 SELECT points.accrue_evergreen();
-- =====================================================================
CREATE OR REPLACE FUNCTION accrue_evergreen() RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = points, public
AS $$
DECLARE rec RECORD; v_cnt INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT id, author_id, category_code
        FROM post
        WHERE upvote_count - downvote_count >= 10           -- 净赞≥10
          AND created_at <= now() - INTERVAL '90 days'      -- 满90天仍受欢迎=常緑
    LOOP
        -- 每月每帖固定 +2，UNIQUE 中带入月份 metadata 防同月重复
        IF award_points('POST_REFERENCED', NULL, rec.author_id,
                        'POST', rec.id, rec.category_code,
                        jsonb_build_object('evergreen_month', to_char(now(),'YYYY-MM'))) > 0 THEN
            v_cnt := v_cnt + 1;
        END IF;
    END LOOP;
    RETURN v_cnt;
END;
$$;

COMMIT;

-- =====================================================================
--  K. 動作確認サンプル (smoke test) — 必要時にコメント解除
-- =====================================================================
-- INSERT INTO app_user(entra_oid,email,display_name,user_type,department) VALUES
--   ('oid-a','a@yfc.co.jp','田中(ベテラン)','EMPLOYEE','保守'),
--   ('oid-b','b@yfc.co.jp','佐藤(新人)','EMPLOYEE','開発'),
--   ('oid-c','c@partner.jp','王(BP)','PARTNER','開発');
-- INSERT INTO post(wiki_ref,author_id,title,category_code,post_type)
--   SELECT 'w-001', id, 'COBOL移行の落とし穴', 'LEGACY','POSTMORTEM'
--   FROM app_user WHERE email='a@yfc.co.jp';
-- -- 佐藤が田中の投稿にいいね → 田中に加点
-- INSERT INTO vote(voter_id,post_id,direction)
--   SELECT (SELECT id FROM app_user WHERE email='b@yfc.co.jp'),
--          (SELECT id FROM post WHERE wiki_ref='w-001'), 1;
-- SELECT display_name,total_points,level_no FROM v_leaderboard;
-- SELECT * FROM v_knowledge_gap;
