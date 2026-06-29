-- 门户演示用户（wiki-app.html 默认 x-user-id）
INSERT INTO wiki.app_user (id, entra_oid, email, display_name, user_type)
SELECT
  '00000000-0000-4000-8000-000000000001'::uuid,
  'portal-demo',
  'demo@portal.local',
  'Portal Demo User',
  'EMPLOYEE'
WHERE NOT EXISTS (
  SELECT 1 FROM wiki.app_user WHERE id = '00000000-0000-4000-8000-000000000001'::uuid
);
