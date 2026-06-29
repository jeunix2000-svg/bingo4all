-- V1__core_schema.sql  — コアスキーマ（app_user / post / contribution / vote / value_rating）
-- 設計書 V1.0 第8章 テーブル定義に対応。
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS wiki;
CREATE SCHEMA IF NOT EXISTS points;

CREATE TABLE wiki.app_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entra_oid     TEXT NOT NULL UNIQUE,
  email         CITEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  user_type     TEXT NOT NULL CHECK (user_type IN ('EMPLOYEE','BP','REVIEWER','MODERATOR','IT_ADMIN','EXECUTIVE')),
  department    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wiki.post (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wiki_ref        TEXT NOT NULL UNIQUE,
  author_id       UUID NOT NULL REFERENCES wiki.app_user(id),
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  category_code   TEXT NOT NULL,
  post_type       TEXT NOT NULL CHECK (post_type IN ('SHARE','QUESTION','REVIEW_ITEM','HOWTO','POSTMORTEM','BEST_PRACTICE')),
  summary         TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','REVIEW','APPROVED','PUBLISHED','ARCHIVED','DELETED')),
  confidentiality TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (confidentiality IN ('PUBLIC','INTERNAL','DEPT','CONFIDENTIAL')),
  upvote_count    INTEGER NOT NULL DEFAULT 0,
  is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_author   ON wiki.post(author_id);
CREATE INDEX idx_post_category ON wiki.post(category_code);
CREATE INDEX idx_post_unresolved ON wiki.post(is_resolved) WHERE is_resolved = FALSE;

CREATE TABLE wiki.contribution (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES wiki.post(id),
  author_id   UUID NOT NULL REFERENCES wiki.app_user(id),
  kind        TEXT NOT NULL CHECK (kind IN ('ANSWER','SUPPLEMENT')),
  is_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contrib_post ON wiki.contribution(post_id);

CREATE TABLE wiki.vote (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id   UUID NOT NULL REFERENCES wiki.app_user(id),
  post_id    UUID NOT NULL REFERENCES wiki.post(id),
  direction  SMALLINT NOT NULL CHECK (direction IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (voter_id, post_id)
);

-- 自票拒否（DB層）。CHECKでは副問合せ不可のためトリガで強制する。
CREATE OR REPLACE FUNCTION wiki.reject_self_vote() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.voter_id = (SELECT author_id FROM wiki.post WHERE id = NEW.post_id) THEN
    RAISE EXCEPTION 'SELF_VOTE_FORBIDDEN' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_reject_self_vote
  BEFORE INSERT ON wiki.vote
  FOR EACH ROW EXECUTE FUNCTION wiki.reject_self_vote();

CREATE TABLE wiki.value_rating (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id   UUID NOT NULL REFERENCES wiki.app_user(id),
  post_id    UUID NOT NULL REFERENCES wiki.post(id),
  usefulness SMALLINT NOT NULL CHECK (usefulness BETWEEN 1 AND 5),
  accuracy   SMALLINT NOT NULL CHECK (accuracy BETWEEN 1 AND 5),
  novelty    SMALLINT NOT NULL CHECK (novelty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rater_id, post_id)
);
