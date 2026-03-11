-- Account Linking Setup
-- =====================
--
-- 1. ENABLE AUTOMATIC ACCOUNT LINKING
--    Go to Supabase Dashboard → Authentication → Settings → User Signups
--    Enable: "Automatically link accounts with the same email"
--
-- 2. DELETE ALL EXISTING USERS (so fresh accounts get proper linking)
--    WARNING: This deletes ALL users and their data. Only run this if you're okay losing everything.
--    Uncomment the lines below to run.

-- Delete all saved items first (foreign key dependency)
-- DELETE FROM saved_items;

-- Delete all profiles (foreign key dependency)
-- DELETE FROM profiles;

-- Delete all users from auth.users
-- DELETE FROM auth.users;
