"use client";



import { useCallback, useRef, useState } from "react";
import { AlertCircle, CloudUpload, ImagePlus, Loader2, X } from "lucide-react";
import {
  ACCEPTED_EXTENSIONS,
  downscaleImage,
  getUploadConfig,
  isAcceptedFile,
  normalizeToJpegIfNeeded,
  uploadOriginalPhoto,
} from "@/lib/uploadClient";
import { WizardPhoto } from "@/lib/types";

export function UploadSection({
  photos,
  setPhotos,
}: {
  photos: WizardPhoto[];
  setPhotos: (updater: (prev: WizardPhoto[]) => WizardPhoto[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setGlobalError(null);

      const config = await getUploadConfig().catch((e) => {
        setGlobalError(e.message);
        return null;
      });
      if (!config) return;

      const files = Array.from(fileList);
      const maxBytes = config.maxUploadMb * 1024 * 1024;

      for (const file of files) {
        if (!isAcceptedFile(file)) {
          setGlobalError(
            `"${file.name}" isn't a supported format. Please upload JPG, PNG, HEIC, or WEBP.`
          );
          continue;
        }
        if (file.size > maxBytes) {
          setGlobalError(`"${file.name}" is larger than ${config.maxUploadMb}MB.`);
          continue;
        }

        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          { id, previewUrl, remoteUrl: null, status: "converting", fileName: file.name },
        ]);

        try {
          const normalized = await normalizeToJpegIfNeeded(file);
          const prepared = await downscaleImage(normalized);
          setPhotos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "uploading" } : p))
          );
          const remoteUrl = await uploadOriginalPhoto(prepared);
          setPhotos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "done", remoteUrl } : p))
          );
        } catch (err) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    status: "error",
                    error: err instanceof Error ? err.message : "Upload failed.",
                  }
                : p
            )
          );
        }
      }
    },
    [setPhotos]
  );

  const removePhoto = (id: string) => setPhotos((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-ink)] text-[var(--color-accent)]">
          <CloudUpload className="h-6 w-6" />
        </div>
        <p className="font-medium text-[var(--color-ink)]">
          Drag &amp; drop photos here, or click to browse
        </p>
        <p className="text-xs text-[var(--color-ink-soft)]">
          Accepted: {ACCEPTED_EXTENSIONS.join(", ")} &middot; Max 20MB per photo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {globalError && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={photo.fileName}
                className="h-full w-full object-cover"
              />
              {(photo.status === "converting" || photo.status === "uploading") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-xs text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {photo.status === "converting" ? "Converting…" : "Uploading…"}
                </div>
              )}
              {photo.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/70 p-2 text-center text-[11px] text-white">
                  <AlertCircle className="h-4 w-4" />
                  {photo.error}
                </div>
              )}
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-xs">Add more</span>
          </button>
        </div>
      )}
    </div>
  );
}
