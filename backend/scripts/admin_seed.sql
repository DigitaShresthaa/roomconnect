INSERT INTO users (
  role,
  full_name,
  email,
  phone,
  password_hash,
  is_verified,
  is_active,
  last_login_at,
  created_at,
  updated_at
) VALUES (
  'admin',
  'Admin 1f82',
  'admin_331008@example.com',
  '9830469640',
  '$2b$12$egY3G2LuNgQqbi9nW1SFUOAElrWkyxr9rfbytSnb35w2BsI1W3We.',
  1,
  1,
  NULL,
  NOW(),
  NOW()
);
