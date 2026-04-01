"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setError("");
    setSuccess("");

    const valid = selected.filter(
      (file) => file.type === "application/pdf"
    );

    if (valid.length === 0) {
      setError("⚠️ Please upload valid PDF files only");
      setFiles([]);
      return;
    }

    setFiles(valid);
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("⚠️ Upload at least 2 PDF files");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);

        const pages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );

        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();

      // ✅ SAFE BLOB FIX (same everywhere)
      const safeBytes = new Uint8Array(mergedBytes);

      const blob = new Blob([safeBytes], {
        type: "application/pdf",
      });

      await saveFile(blob, `merged-${Date.now()}.pdf`);

      setSuccess("✅ PDF merged successfully!");

    } catch (err) {
      console.error(err);
      setError("❌ Merge failed. Try again.");
    }

    setLoading(false);
  };

  const saveFile = async (blob: Blob, fileName: string) => {
    try {
      const base64Data = await blobToBase64(blob);

      if (Capacitor.getPlatform() === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      // ✅ Android fix
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "PDF Ready",
        text: "Your merged PDF is ready",
        url: result.uri,
      });

    } catch (err) {
      console.error(err);
      setError("❌ Failed to save file");
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
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
        Merge PDF
      </h1>

      <div className="bg-slate-800 p-4 rounded-xl shadow mb-4">
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>

      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded-lg"
            >
              <span className="text-sm truncate">
                {i + 1}. {file.name}
              </span>

              <button
                onClick={() => removeFile(i)}
                className="text-red-400 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <p className="text-center text-gray-400 text-sm mb-3">
          {files.length} file(s) ready to merge
        </p>
      )}

      {error && (
        <p className="text-red-400 text-center mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-center mb-3">{success}</p>
      )}

      <button
        onClick={mergePDFs}
        disabled={loading}
        className="w-full bg-blue-500 py-3 rounded-xl font-semibold hover:bg-blue-600 transition active:scale-95 disabled:opacity-50"
      >
        Merge & Download
      </button>
    </div>
  );
}