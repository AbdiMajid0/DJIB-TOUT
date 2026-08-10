"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2, Video } from "lucide-react";
import { uploadMedia } from "@/lib/api";
export default function MediaManager({
  images,
  onImagesChange,
  videoUrl,
  onVideoChange,
}: {
  images: string[];
  onImagesChange: (v: string[]) => void;
  videoUrl: string;
  onVideoChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const upload = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => ({ file, url: await uploadMedia(file) })),
      );
      const nextImages = uploaded
        .filter((x) => x.file.type.startsWith("image/"))
        .map((x) => x.url);
      const video = uploaded.find((x) => x.file.type.startsWith("video/"));
      onImagesChange([...images, ...nextImages].slice(0, 8));
      if (video) onVideoChange(video.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload impossible.");
    } finally {
      setBusy(false);
    }
  };
  const move = (i: number, d: number) => {
    const next = [...images],
      j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onImagesChange(next);
  };
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div>
        <h2 className="font-extrabold">Images et vidéo</h2>
        <p className="text-xs text-slate-500">
          Jusqu’à 8 images. La première est l’image principale.
        </p>
      </div>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-sm font-bold text-[#0052cc]">
        <ImagePlus className="h-5 w-5" />
        {busy ? "Envoi…" : "Ajouter des médias"}
        <input
          className="hidden"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          disabled={busy}
          onChange={(e) => {
            void upload(Array.from(e.target.files || []));
            e.currentTarget.value = "";
          }}
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="rounded-xl border p-2">
            <Image
              src={src}
              alt={`Image ${i + 1}`}
              width={320}
              height={112}
              unoptimized
              className="h-28 w-full object-contain"
            />
            <div className="mt-2 flex justify-between">
              <button type="button" onClick={() => move(i, -1)} disabled={!i}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onImagesChange(images.filter((_, x) => x !== i))}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <label className="block text-sm font-semibold">
        <span className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          URL vidéo
        </span>
        <input
          value={videoUrl}
          onChange={(e) => onVideoChange(e.target.value)}
          placeholder="https://…"
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>
      {videoUrl && (
        <video
          src={videoUrl}
          controls
          className="max-h-48 w-full rounded-xl bg-black"
        />
      )}
    </section>
  );
}
