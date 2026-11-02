// =============================================================================
// FILE: lib/auth/password.ts — bcrypt hashing + password policy
// =============================================================================
import 'server-only';
import bcrypt from 'bcryptjs';

const ROUNDS = 12;
// compared against when the email doesn't exist, so response time doesn't reveal which emails exist
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= bcrypt.hash('not-a-real-password', ROUNDS));

export const hashPassword = (pw: string) => bcrypt.hash(pw, ROUNDS);
export async function verifyPassword(pw: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(pw, hash || (await dummyHash()));
  return ok && Boolean(hash);
}

const COMMON = ['password', '12345678', 'qwerty', 'letmein', 'admin', 'welcome', 'iloveyou', 'cyber', 'pakistan'];

/** null = OK, otherwise a message for the user */
export function passwordProblem(pw: string, email = ''): string | null {
  if (pw.length < 12) return 'Use at least 12 characters.';
  if (pw.length > 128) return 'Use at most 128 characters.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 3) return 'Mix at least three of: lowercase, uppercase, numbers, symbols.';
  const low = pw.toLowerCase();
  if (COMMON.some((c) => low.includes(c))) return 'Avoid common words like “password” or “admin”.';
  const local = email.split('@')[0]?.toLowerCase();
  if (local && local.length > 3 && low.includes(local)) return 'Don’t include your email name in the password.';
  return null;
}
