"use client";

import { useRef, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ImageUploader() {
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const storeImage = useMutation(api.images.storeImage);

  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;

    setFileName(file.name);
    setStatus("idle");

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);
function handleUpload() {
  const file = inputRef.current?.files?.[0];
  if (!file) return;

  setStatus("uploading");

  generateUploadUrl()
    .then((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
    )
    .then((res) => res.json())
    .then(({ storageId }) =>
     
      fetch("/api/ImageProcessing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageId }),
      })
    )
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) throw new Error("Processing failed");
      setStatus("success");
    })
    .catch(() => setStatus("error"));
}

  function handleReset() {
    setPreview(null);
    setFileName(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <div className="w-full max-w-md p-6 space-y-4 bg-neutral-800 rounded-lg shadow">

        {/* Title */}
        <h2 className="text-lg font-semibold">Upload Image</h2>

        {/* Drop zone */}
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              isDragging
                ? "border-blue-400 bg-neutral-700"
                : "border-neutral-600"
            }`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <p className="text-sm text-neutral-300">
              Drag & drop image here or click to browse
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <img
              src={preview}
              alt="preview"
              className="w-full h-48 object-cover rounded"
            />
            <p className="text-sm text-neutral-400 truncate">{fileName}</p>
          </div>
        )}

        {/* Buttons */}
        {preview && (
          <div className="space-y-2">
            <button
              onClick={handleUpload}
              disabled={status === "uploading" || status === "success"}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
            >
              {status === "uploading"
                ? "Uploading..."
                : status === "success"
                ? "Uploaded"
                : "Upload"}
            </button>

            <button
              onClick={handleReset}
              className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
            >
              Reset
            </button>
          </div>
        )}

        {/* Status */}
        {status === "success" && (
          <p className="text-green-400 text-sm">Upload successful</p>
        )}

        {status === "error" && (
          <p className="text-red-400 text-sm">Upload failed</p>
        )}

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    </div>
  );
}