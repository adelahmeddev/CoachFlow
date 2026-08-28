import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth"

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session?.user.role === "ADMIN") {
    redirect("/admin");
  }
  if (session?.user.role === "TRAINER") {
    redirect("/dashboard");
  }
  redirect("/login");
}
