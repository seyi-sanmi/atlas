-- Make specific user an admin
-- User ID: b227209a-62f4-418d-b5ee-d60cdc2d1846

-- 1. Check if user exists and current role
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.created_at,
    u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = 'b227209a-62f4-418d-b5ee-d60cdc2d1846';

-- 2. Update user to super_admin role
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = 'b227209a-62f4-418d-b5ee-d60cdc2d1846';

-- 3. Verify the change worked
SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email,
    'User is now super_admin' as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = 'b227209a-62f4-418d-b5ee-d60cdc2d1846';

-- 4. Check all current admins
SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role IN ('admin', 'super_admin')
ORDER BY p.created_at;
