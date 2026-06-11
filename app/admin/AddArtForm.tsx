"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createArtwork } from "./actions";

const input = "input";

export default function AddArtForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Compress in the browser: target ~2.5MB, max edge 2560px. Good detail for
  // art, still well under the 1GB free storage budget for 100 pieces.
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("Compressing…");
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2.5,
        maxWidthOrHeight: 2560,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      setCompressedFile(
        new File([compressed], file.name.replace(/\.\w+$/, ".jpg"), {
          type: "image/jpeg",
        })
      );
      setPreview(URL.createObjectURL(compressed));
      setMsg(`Ready (${(compressed.size / 1024 / 1024).toFixed(2)} MB)`);
    } catch {
      setMsg("Could not process that image.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!compressedFile) return setMsg("Please add a photo.");
    setBusy(true);
    setMsg("Publishing…");
    const fd = new FormData(e.currentTarget);
    fd.set("image", compressedFile);
    try {
      await createArtwork(fd);
      formRef.current?.reset();
      setPreview(null);
      setCompressedFile(null);
      setMsg("Published.");
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div>
        {/* capture="environment" opens the rear camera on mobile */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="block w-full text-sm text-muted file:mr-4 file:rounded-md file:border file:border-line file:bg-raise file:px-4 file:py-2 file:text-sm file:text-ink file:transition-colors hover:file:border-accent/50"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="preview"
            className="mt-3 max-h-64 rounded-lg border border-line object-contain"
          />
        )}
      </div>

      <input name="title" placeholder="Title" className={input} required />
      <input
        name="price_inr"
        type="number"
        min="1"
        placeholder="Price (₹)"
        className={input}
        required
      />
      <input name="medium" placeholder="Medium (e.g. Oil on canvas)" className={input} />
      <input name="dimensions" placeholder="Dimensions (e.g. 40 × 50 cm)" className={input} />
      <textarea
        name="description"
        placeholder="Description"
        rows={4}
        className={input}
      />

      <button disabled={busy} className="btn-primary w-full">
        Publish
      </button>
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </form>
  );
}
