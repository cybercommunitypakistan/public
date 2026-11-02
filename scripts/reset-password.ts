// =============================================================================
// FILE: scripts/reset-password.ts — Reset a user's password
//   npm run reset-password admin@admin.com
// =============================================================================
import 'dotenv/config';
import readline from 'node:readline';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../lib/models';

function ask(q: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    out._writeToOutput = (s: string) => out.output.write(s.includes(q) ? s : '*');
  }
  return new Promise((res) => rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); res(a.trim()); }));
}

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error('Usage: npm run reset-password <email>');

  const uri = process.env.MONGODB_URI || "";
  if (!uri) throw new Error('MONGODB_URI is not set');
  
  await mongoose.connect(uri);
  
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error(`User ${email} not found`);

  console.log(`Found user: ${user.name} (${user.email})`);
  const newPassword = await ask('New password: ', true);
  
  if (newPassword.length < 12) throw new Error('Password must be at least 12 characters');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne(
    { _id: user._id },
    { 
      $set: { 
        passwordHash, 
        failedLogins: 0, 
        lockedUntil: null, 
        passwordChangedAt: new Date() 
      } 
    }
  );
  
  console.log(`✅ Password updated for ${email}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('❌ Error:', e.message);
  await mongoose.disconnect();
  process.exit(1);
});
