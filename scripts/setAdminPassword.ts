// scripts/setAdminPassword.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const email = process.argv[2];
const password = process.argv[3];

if (!url || !key) {
  console.error('error:', { message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' });
  process.exit(1);
}

if (!email || !password) {
  console.error('error:', { message: 'Usage: tsx scripts/setAdminPassword.ts <email> <newPassword>' });
  process.exit(1);
}

(async () => {
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  
  // First, find the user by email
  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  
  if (listError) {
    console.error('error:', { message: listError.message, status: (listError as any)?.status ?? null });
    process.exit(1);
  }
  
  const user = users?.users?.find(u => u.email === email);
  
  if (!user) {
    console.error('error:', { message: `User with email ${email} not found`, status: 404 });
    process.exit(1);
  }
  
  // Update the user's password by ID
  const { data, error } = await admin.auth.admin.updateUserById(user.id, { password });

  if (error) {
    console.error('error:', { message: error.message, status: (error as any)?.status ?? null });
    process.exit(1);
  }

  console.log('ok: true', { userId: data?.user?.id, email: data?.user?.email });
})();