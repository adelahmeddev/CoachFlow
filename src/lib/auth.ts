import { hash, verify } from '@node-rs/bcrypt'

const SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS
  ? Number(process.env.BCRYPT_SALT_ROUNDS)
  : 12

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return verify(hashedPassword, password)
}
