-- V2__points.sql — 積分台帳（追加専用）・残高・信誉・ルール（point_rule）
CREATE TABLE points.point_rule (
  rule_code           TEXT PRIMARY KEY,
  base_points         INTEGER NOT NULL,
  daily_cap           INTEGER,
  reputation_weighted BOOLEAN NOT NULL DEFAULT FALSE,
  description         TEXT NOT NULL
);

-- ドメイン(pointRules.js)と同一値を保つこと
INSERT INTO points.point_rule(rule_code, base_points, daily_cap, reputation_weighted, description) VALUES
 ('POST_CREATE',          5, NULL, FALSE, '投稿作成'),
 ('ANSWER_CREATE',        3, NULL, FALSE, '疑問への回答'),
 ('SUPPLEMENT_CREATE',    2, NULL, FALSE, '有効な補足'),
 ('RATING_GIVE',          1, 5,    FALSE, '誠実な評価（日次上限5）'),
 ('UPVOTE_RECEIVED',      1, NULL, TRUE,  'いいね獲得（信誉加重）'),
 ('ANSWER_ACCEPTED',     15, NULL, FALSE, 'ベストアンサー採択'),
 ('SUPPLEMENT_ACCEPTED',  8, NULL, FALSE, '補足の採択'),
 ('POST_BEST_ANSWER',    20, NULL, FALSE, '投稿にベストアンサーが付いた'),
 ('REFERENCED',           3, NULL, FALSE, '他投稿から参照された'),
 ('LOW_QUALITY_PENALTY', -3, NULL, FALSE, '低質投稿の多数低評価');

CREATE TABLE points.point_event (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES wiki.app_user(id),
  actor_id      UUID REFERENCES wiki.app_user(id),
  rule_code     TEXT NOT NULL REFERENCES points.point_rule(rule_code),
  points        INTEGER NOT NULL,
  ref_type      TEXT NOT NULL,
  ref_id        TEXT NOT NULL,                  -- 冪等参照キー（UUIDまたは複合キー）
  category_code TEXT,
  weight        NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_code, ref_type, ref_id, user_id)   -- 二重記帳防止（冪等）
);
CREATE INDEX idx_pe_user ON points.point_event(user_id);
CREATE INDEX idx_pe_actor_rule_day ON points.point_event(actor_id, rule_code, created_at);

CREATE TABLE points.user_point_balance (
  user_id      UUID PRIMARY KEY REFERENCES wiki.app_user(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  level_no     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE points.user_domain_reputation (
  user_id       UUID NOT NULL REFERENCES wiki.app_user(id),
  category_code TEXT NOT NULL,
  reputation    INTEGER NOT NULL DEFAULT 0,
  is_verifier   BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, category_code)
);

-- 追加専用の担保：point_event は UPDATE/DELETE を許可しない（最小権限はアプリロールで付与）
REVOKE UPDATE, DELETE ON points.point_event FROM PUBLIC;
