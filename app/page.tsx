import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/current-user";

export default async function HomePage() {
  const user = await getCurrentUserFromCookie();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}