import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingContent } from "./LandingContent";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  return <LandingContent />;
}
