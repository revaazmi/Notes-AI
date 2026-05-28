import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NoteEditor } from "@/components/features/NoteEditor";
import { redirect } from "next/navigation";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const [note] = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.id, id),
        isNull(notes.deletedAt),
        isAdmin ? undefined : eq(notes.userId, session.user.id)
      )
    );

  if (!note) return <div className="p-xl text-body-md text-semantic-error">Note not found.</div>;

  return (
    <NoteEditor
      noteId={id}
      initialTitle={note.title}
      initialContent={note.content}
      category={note.category}
    />
  );
}
