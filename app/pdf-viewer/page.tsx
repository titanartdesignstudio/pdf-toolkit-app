"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function PDFViewer() {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || file.type !== "application/pdf") {
      setError("⚠️ Please upload a valid PDF");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setPages([]);
    setError("");
    setSuccess("");
    setTotalPages(0);

    try {
      // ✅ FINAL FIX (LEGACY IMPORT)
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf");

      // ✅ WORKER
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const buffer = await file.arrayBuffer();
      const pdf = await (pdfjsLib as any).getDocument({ data: buffer }).promise;

      setTotalPages(pdf.numPages);

      const images: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const viewport = page.getViewport({ scale: 1.3 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        images.push(canvas.toDataURL("image/jpeg", 0.8));
      }

      setPages(images);
      setSuccess("✅ PDF loaded successfully!");

    } catch (err) {
      console.error(err);
      setError("❌ Error rendering PDF");
    }

    setLoading(false);
  };

  const resetViewer = () => {
    setPages([]);
    setFileName("");
    setError("");
    setSuccess("");
    setTotalPages(0);
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

      <h1 className="text-2xl font-bold text-center mb-6">
        PDF Viewer
      </h1>

      <div className="bg-slate-800 p-4 rounded-xl mb-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>

      {fileName && (
        <p className="text-center text-gray-400 mb-2">
          {fileName} ({totalPages} pages)
        </p>
      )}

      {error && <p className="text-red-400 text-center mb-2">{error}</p>}
      {success && <p className="text-green-400 text-center mb-2">{success}</p>}

      {pages.length > 0 && (
        <button
          onClick={resetViewer}
          className="w-full bg-red-500 py-2 rounded mb-3"
        >
          Reset
        </button>
      )}

      <div className="space-y-4">
        {pages.map((img, i) => (
          <img key={i} src={img} className="w-full rounded" />
        ))}
      </div>
    </div>
  );
}