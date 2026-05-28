"use client";

import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const PREVIEW_SIZE = 200;

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");
  const [imageInput, setImageInput] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deleteState, setDeleteState] = useState<"idle" | "codeSent" | "deleting">("idle");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-section-sm p-xl">
        <h1 className="typography-heading-2 text-charcoal">Settings</h1>
        <p className="text-body-md text-slate">Loading...</p>
      </div>
    );
  }

  const initial = session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || "U";
  const currentImage = imageInput !== undefined ? imageInput : session?.user?.image;
  const hasImage = !!currentImage;

  const avatarPreview = currentImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentImage}
      alt="Avatar"
      className="h-14 w-14 rounded-full object-cover border border-hairline"
    />
  ) : (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card-tint-mint text-body-md font-medium text-brand-green">
      {initial}
    </span>
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: "error", text: "Image too large (max 2MB)" });
      return;
    }

    resizeImage(file, PREVIEW_SIZE)
      .then((dataUrl) => setImageInput(dataUrl))
      .catch(() => setMessage({ type: "error", text: "Failed to process image" }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const finalName = nameInput || session?.user?.name?.trim() || "";
    const finalImage = imageInput !== undefined ? (imageInput || null) : (session?.user?.image || null);

    const hasNameChange = finalName !== (session?.user?.name || "");
    const hasImageChange = finalImage !== (session?.user?.image || null);

    if (!finalName || finalName.length > 100) {
      setMessage({ type: "error", text: "Name must be between 1 and 100 characters" });
      return;
    }

    if (!hasNameChange && !hasImageChange) {
      setMessage({ type: "success", text: "No changes to save" });
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, string | null> = {};
      if (hasNameChange) body.name = finalName;
      if (hasImageChange) body.image = finalImage;

      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save" });
        setSaving(false);
        return;
      }

      const saved = await res.json();
      setNameInput("");
      setImageInput(undefined);
      await update({ name: saved.name, image: saved.image });
      setMessage({ type: "success", text: "Settings saved successfully" });
      setSaving(false);
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
      setSaving(false);
    }
  };

  const handleRequestDelete = async () => {
    setDeleteError("");
    setDeleteCode("");
    try {
      const res = await fetch("/api/auth/delete-account/send-code", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to send code");
        return;
      }
      setDeleteState("codeSent");
    } catch {
      setDeleteError("Something went wrong");
    }
  };

  const handleConfirmDelete = async () => {
    if (!/^\d{6}$/.test(deleteCode)) {
      setDeleteError("Enter a valid 6-digit code");
      return;
    }
    setDeleteError("");
    setDeleteState("deleting");
    try {
      const res = await fetch("/api/auth/delete-account/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deleteCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account");
        setDeleteState("codeSent");
        return;
      }
      signOut({ callbackUrl: "/" });
    } catch {
      setDeleteError("Something went wrong");
      setDeleteState("codeSent");
    }
  };

  const displayName = nameInput || session?.user?.name || "";

  return (
    <AuthGuard>
    <div className="flex flex-col gap-section-sm p-xl">
      <h1 className="typography-heading-2 text-charcoal">Settings</h1>
      <p className="text-body-md text-slate">Manage your account</p>

      <div className="w-full max-w-[32rem] self-center">
        <form onSubmit={handleSave} className="flex flex-col gap-md">
          <div className="flex flex-col gap-1">
            <label className="text-body-sm text-slate">Profile Photo</label>
            <div className="flex items-center gap-4">
              {avatarPreview}
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer rounded-md bg-surface px-md py-[6px] text-body-sm text-ink hover:bg-hairline transition-colors">
                  Upload Photo
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                </label>
                {hasImage && (
                  <button
                    type="button"
                    onClick={() => { setMessage(null); setImageInput(""); }}
                    className="text-body-xs text-steel hover:text-semantic-error transition-colors text-left"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            <p className="text-body-xs text-slate">Upload a photo (JPEG, PNG — max 2MB, resized to 200px)</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-body-sm text-slate">Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setMessage(null); setNameInput(e.target.value); }}
              className="rounded-md border border-hairline bg-canvas px-md py-[10px] text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-primary"
              required
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-body-sm text-slate">Email</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              className="rounded-md border border-hairline bg-surface px-md py-[10px] text-body-md text-muted outline-none cursor-not-allowed"
              disabled
            />
            <p className="text-body-xs text-slate">Email cannot be changed</p>
          </div>

          {message && (
            <p className={`text-body-sm ${message.type === "success" ? "text-green-600" : "text-semantic-error"}`}>
              {message.text}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>

        <div className="border-t border-hairline pt-md mt-section">
          <h2 className="text-body-md font-medium text-charcoal mb-sm">Password</h2>
          <Link
            href="/forgot-password"
            className="text-link-blue hover:underline text-body-sm"
          >
            Change password
          </Link>
        </div>

        <div className="border-t border-hairline pt-md mt-section">
          <h2 className="text-body-md font-medium text-semantic-error mb-sm">Delete Account</h2>
          <div className="rounded-lg border border-semantic-error/30 bg-semantic-error/5 p-lg flex flex-col gap-md">
            <p className="text-body-sm text-slate">
              Permanently delete your account and all data. This action cannot be undone.
            </p>

            {deleteState === "idle" && (
              <Button variant="secondary" onClick={handleRequestDelete}>
                Request Deletion Code
              </Button>
            )}

            {deleteState === "codeSent" && (
              <div className="flex flex-col gap-md">
                <p className="text-body-sm text-slate">
                  A 6-digit code was sent to <strong>{session?.user?.email}</strong>. Check your inbox.
                </p>
                <input
                  value={deleteCode}
                  onChange={(e) => { setDeleteError(""); setDeleteCode(e.target.value.replace(/\D/g, "").slice(0, 6)); }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-md border border-hairline bg-canvas px-md py-[10px] text-body-md text-ink outline-none transition-colors placeholder:text-muted focus:border-semantic-error text-center text-display-lg tracking-widest"
                />
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => setDeleteState("idle")}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmDelete}
                    disabled={deleteCode.length !== 6}
                    className="bg-semantic-error hover:bg-red-700"
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            )}

            {deleteState === "deleting" && (
              <p className="text-body-sm text-slate">Deleting your account...</p>
            )}

            {deleteError && (
              <p className="text-body-sm text-semantic-error">{deleteError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
