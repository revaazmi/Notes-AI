# Auto-save Implementation Plan

**Target:** `src/components/features/NoteEditor.tsx`

## What to Add

Insert a new `useEffect` between the note-fetch effect and the `runAI` function:

```tsx
useEffect(() => {
  if (!noteId || !isDirty) return;
  const timer = setTimeout(async () => {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category: currentCategory }),
      });
      savedRef.current = { title, content, category: currentCategory };
    } catch {
      console.error("Auto-save failed");
    }
  }, 1500);
  return () => clearTimeout(timer);
}, [title, content, currentCategory, noteId, isDirty]);
```

## How it Works

1. **Guard:** Only runs if `noteId` exists (note already saved) AND `isDirty === true`
2. **Debounce:** `setTimeout` 1500ms — resets on every keystroke via `clearTimeout` cleanup
3. **Save:** PUT request with current title, content, category
4. **Reset:** Updates `savedRef.current` so `isDirty` becomes `false`
5. **Error:** `console.error` only — no user-facing toast (non-blocking)

## Footer Behavior

Already handled by existing code:
- `isDirty === true` → "Unsaved changes"
- `noteId && !isDirty` → "Saved"
- `!noteId` → "Draft — not saved"
