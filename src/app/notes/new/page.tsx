import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NoteEditor } from "@/components/features/NoteEditor";

export default async function NewNotePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return <NoteEditor />;
}
