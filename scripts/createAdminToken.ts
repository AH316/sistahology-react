import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.scripts
dotenv.config({ path: resolve(__dirname, '../.env.scripts') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.scripts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Args {
  email?: string;
  days?: number;
}

function parseArgs(): Args {
  const args: Args = {};

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--email' && process.argv[i + 1]) {
      args.email = process.argv[i + 1];
      i++;
    } else if (process.argv[i] === '--days' && process.argv[i + 1]) {
      args.days = parseInt(process.argv[i + 1], 10);
      i++;
    }
  }

  return args;
}

async function createAdminToken() {
  const args = parseArgs();

  if (!args.email) {
    console.error('❌ Email is required. Usage: npm run create:token -- --email user@example.com [--days 7]');
    process.exit(1);
  }

  const expiresInDays = args.days || 7;
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Get the first admin user as creator (or use service account)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single();

  const createdBy = profiles?.id || '00000000-0000-0000-0000-000000000000';

  const { data, error } = await supabase
    .from('admin_registration_tokens')
    .insert({
      token,
      email: args.email,
      created_by_user_id: createdBy,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create token:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Admin registration token created successfully!\n');
  console.log(`📧 Email: ${args.email}`);
  console.log(`⏰ Expires: ${expiresAt.toLocaleString()} (${expiresInDays} days)`);
  console.log(`🔗 Registration Link:\n`);
  console.log(`   https://sistahology.com/#/register?token=${token}\n`);
  console.log(`💡 Share this link with the new admin candidate.`);
  console.log(`   They must register with the email: ${args.email}\n`);
}

createAdminToken();
