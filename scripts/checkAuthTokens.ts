import * as fs from 'fs';
import * as path from 'path';

const userAuthPath = path.join(process.cwd(), 'tests/.auth/user.json');
const adminAuthPath = path.join(process.cwd(), 'tests/.auth/admin.json');

function checkToken(filePath: string, label: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${label}: File not found at ${filePath}`);
    return false;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const authData = JSON.parse(content.origins[0].localStorage[0].value);
    const expiresAt = authData.expires_at * 1000; // Convert to ms
    const now = Date.now();
    const timeLeft = expiresAt - now;
    const minutesLeft = Math.floor(timeLeft / 60000);

    if (timeLeft <= 0) {
      console.error(`❌ ${label}: Token EXPIRED ${Math.abs(minutesLeft)} minutes ago`);
      return false;
    } else if (minutesLeft < 10) {
      console.warn(`⚠️  ${label}: Token expires in ${minutesLeft} minutes`);
      return true;
    } else {
      console.log(`✅ ${label}: Token valid for ${minutesLeft} minutes`);
      return true;
    }
  } catch (error) {
    console.error(`❌ ${label}: Error reading token file:`, error);
    return false;
  }
}

const userValid = checkToken(userAuthPath, 'User Session');
const adminValid = checkToken(adminAuthPath, 'Admin Session');

if (!userValid || !adminValid) {
  console.log('\n💡 Regenerate auth sessions by running:');
  console.log('   npx playwright test --project=setupAdmin\n');
  process.exit(1);
}

console.log('\n✅ All auth sessions are valid\n');
