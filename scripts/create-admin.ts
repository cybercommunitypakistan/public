// =============================================================================
// FILE: scripts/create-admin.ts — create (or reset) an admin from the terminal
//   pnpm admin:create                         → asks for email, name, password
//   pnpm admin:create --role editor           → any role slug (default: owner)
// The password is typed hidden and never stored in shell history.
// =============================================================================
import 'dotenv/config';
import readline from 'node:readline';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role, User } from '../lib/models';

function ask(q: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
    out._writeToOutput = (s: string) => out.output.write(s.includes(q) ? s : '*');
  }
  return new Promise((res) => rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); res(a.trim()); }));
}

function weak(pw: string) {
  if (pw.length < 12) return 'at least 12 characters';
  if ([/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length < 3) return 'mix of lowercase, uppercase, numbers, symbols';
  return null;
}

async function main() {
  const uri = process.env.MONGODB_URI || ''; if (!uri) throw new Error('MONGODB_URI is not set');
  const roleSlug = process.argv.includes('--role') ? process.argv[process.argv.indexOf('--role') + 1] : 'owner';
  await mongoose.connect(uri);
  const role = await Role.findOne({ slug: roleSlug });
  if (!role) throw new Error(`Role "${roleSlug}" not found — run pnpm db:seed first`);

  const email = (process.env.ADMIN_EMAIL || (await ask('Email: '))).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email');
  const name = process.env.ADMIN_NAME || (await ask('Name: ')) || email.split('@')[0];
  const password = process.env.ADMIN_PASSWORD || (await ask('Password: ', true));
  const problem = weak(password); if (problem) throw new Error(`Password too weak: ${problem}`);

  const passwordHash = await bcrypt.hash(password, 12);
  await User.updateOne(
    { email },
    { $set: { name, passwordHash, role: role._id, status: 'active', failedLogins: 0, lockedUntil: null, passwordChangedAt: new Date() } },
    { upsert: true },
  );
  console.log(`✓ ${email} is now ${role.name}. Sign in at /admin/login`);
  await mongoose.disconnect();
}

main().catch(async (e) => { console.error('✗', e.message); await mongoose.disconnect(); process.exit(1); });
