// =============================================================================
// FILE: scripts/test-login.ts — Debug login issues
// =============================================================================
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role, User } from '../lib/models';

async function main() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) throw new Error('MONGODB_URI is not set');
  
  await mongoose.connect(uri);
  console.log('🔍 Testing login setup...\n');

  // Check users
  const users = await User.find().select('+passwordHash').lean();
  console.log(`Found ${users.length} user(s):`);
  for (const user of users) {
    console.log(`\n📧 Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role ID: ${user.role}`);
    console.log(`   Failed Logins: ${user.failedLogins}`);
    console.log(`   Locked Until: ${user.lockedUntil || 'Not locked'}`);
    console.log(`   Password Hash: ${user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'MISSING!'}`);
    
    // Check if role exists
    const role = await Role.findById(user.role);
    if (role) {
      console.log(`   ✅ Role Found: ${role.name} (${role.slug})`);
    } else {
      console.log(`   ❌ Role NOT FOUND! This will cause login to fail.`);
    }
  }

  // Check roles
  console.log('\n\n🎭 Available Roles:');
  const roles = await Role.find().lean();
  for (const role of roles) {
    console.log(`   - ${role.name} (${role.slug}) ID: ${role._id}`);
    console.log(`     Permissions: ${role.permissions.length}`);
  }

  // Test password verification
  console.log('\n\n🔐 Testing password hashing:');
  const testPassword = 'TestPassword123!';
  const testHash = await bcrypt.hash(testPassword, 12);
  console.log(`   Test password: ${testPassword}`);
  console.log(`   Generated hash: ${testHash}`);
  const verified = await bcrypt.compare(testPassword, testHash);
  console.log(`   Verification: ${verified ? '✅ Success' : '❌ Failed'}`);

  // Check if any user has the test hash format
  for (const user of users) {
    if (user.passwordHash) {
      const startsCorrectly = user.passwordHash.startsWith('$2b$12$') || user.passwordHash.startsWith('$2a$12$');
      console.log(`\n   ${user.email}: Hash format ${startsCorrectly ? '✅ Valid' : '❌ Invalid'}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Diagnostic complete');
}

main().catch(async (e) => {
  console.error('❌ Error:', e.message);
  await mongoose.disconnect();
  process.exit(1);
});
