"use client";

import { useState, useRef } from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function PDFToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState("");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const openPicker = () => {
    fileRef.current?.click();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected || selected.type !== "application/pdf") {
      setError("⚠️ Please upload a valid PDF file");
      setFile(null);
      return;
    }

    setError("");
    setSuccess("");
    setFile(selected);
    setImages([]);
    setProgress(0);
  };

  const convertToImages = async () => {
    if (!file) {
      setError("⚠️ Upload a PDF first");
      return;
    }

    setLoading(true);
    setError("");
    setImages([]);
    setProgress(0);
    setSuccess("");

    try {
      // ✅ CLIENT ONLY IMPORT (NO BUILD ERROR)
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");

      // ✅ LOCAL WORKER
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const buffer = await file.arrayBuffer();

      const pdf = await (pdfjsLib as any).getDocument({ data: buffer }).promise;

      const imgs: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const viewport = page.getViewport({ scale: 1 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        imgs.push(canvas.toDataURL("image/jpeg", 0.7));

        setProgress(Math.round((i / pdf.numPages) * 100));
      }

      setImages(imgs);
      setSuccess("✅ Conversion completed!");

    } catch (err) {
      console.error(err);
      setError("❌ Conversion failed");
    }

    setLoading(false);
  };

  const handleShare = async (img: string, index: number) => {
    try {
      const base64 = img.split(",")[1];
      const fileName = `page-${index + 1}.jpg`;

      if (Capacitor.getPlatform() === "web") {
        const link = document.createElement("a");
        link.href = img;
        link.download = fileName;
        link.click();
        return;
      }

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "Image Ready",
        text: fileName,
        url: result.uri,
      });

    } catch (err) {
      console.error(err);
      setError("❌ Failed to save image");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">

      {loading && <Loader />}

      <button
        onClick={() => router.back()}
        className="text-blue-400 mb-4 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-center mb-6 tracking-wide">
        PDF → Image
      </h1>

      <button
        onClick={openPicker}
        className="w-full bg-blue-500 py-3 rounded-xl mb-4 font-semibold"
      >
        Select PDF
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        className="hidden"
      />

      {file && (
        <p className="text-sm text-gray-400 mb-3 text-center">
          {file.name}
        </p>
      )}

      {error && (
        <p className="text-red-400 text-center mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-center mb-3">{success}</p>
      )}

      {loading && (
        <p className="text-center text-gray-400 mb-3">
          Processing {progress}%
        </p>
      )}

      <button
        onClick={convertToImages}
        disabled={loading}
        className="w-full bg-blue-500 py-3 rounded-xl mb-4 font-semibold disabled:opacity-50"
      >
        Convert
      </button>

      <div className="space-y-4">
        {images.map((img, i) => (
          <div key={i} className="space-y-2">
            <img
              src={img}
              className="w-full rounded-lg"
              alt={`page-${i + 1}`}
            />

            <button
              onClick={() => handleShare(img, i)}
              className="w-full bg-green-500 py-2 rounded-lg font-semibold"
            >
              Save / Share Page {i + 1}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}