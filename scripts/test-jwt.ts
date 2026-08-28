import "dotenv/config"
import { encode, getToken } from "next-auth/jwt"
import * as fs from "fs"

async function main() {
  const userId = "cm_test_user_0001"
  const trainerProfileId = "cm_test_trainer_01"
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET as string,
    maxAge: 24 * 60 * 60,
    token: {
      sub: userId,
      id: userId,
      name: "Test Trainer",
      email: "",
      role: "TRAINER",
      trainerProfileId,
    },
  })
  fs.writeFileSync(
    "C:\\Users\\ADELAH~1\\AppData\\Local\\Temp\\opencode\\tok2.txt",
    token
  )
  console.log("token len:", token.length)

  const mockReq = {
    cookies: { "next-auth.session-token": token },
    headers: {},
  } as never

  const got = await getToken({
    req: mockReq,
    secret: process.env.NEXTAUTH_SECRET as string,
  })
  console.log("getToken:", got ? JSON.stringify(got) : "INVALID (null)")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})