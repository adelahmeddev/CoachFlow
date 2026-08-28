import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS ? Number(process.env.BCRYPT_SALT_ROUNDS) : 12
  return bcrypt.hash(password, saltRounds)
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}