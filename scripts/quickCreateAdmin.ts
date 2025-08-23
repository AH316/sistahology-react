// scripts/quickCreateAdmin.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email = process.argv[2]; // pass the email as CLI arg

if (!url || !key || !email) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / email arg');
  process.exit(1);
}

(async () => {
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,                // auto-confirm account
    app_metadata: { role: 'admin' },    // set admin role
  });
  console.log('data:', data);
  console.error('error:', error);
})();