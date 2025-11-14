-- Check your admin status and fix if needed

-- 1. Check your current user ID and email
SELECT 
    auth.uid() as current_user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email;

-- 2. Check your profile and role
SELECT 
    p.id,
    p.full_name,
    p.role,
    p.created_at,
    u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'seyi@renphil.org';

-- 3. Check if you can access admin functions
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        ) 
        THEN 'You have admin access' 
        ELSE 'You DO NOT have admin access'
    END as admin_status;

-- 4. If you don't have admin access, let's fix it
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = auth.uid();

-- 5. Verify the fix worked
SELECT 
    p.role,
    u.email,
    'Should now have admin access' as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = auth.uid();
