import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth"

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session?.user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (session?.user.role === "COACH") {
    redirect("/dashboard");
  }
  redirect("/login");
}
