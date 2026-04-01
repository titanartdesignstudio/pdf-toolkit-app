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
      const pdfjsLib: any = await import("pdfjs-dist");

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      setTotalPages(pdf.numPages);

      const images: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const viewport = page.getViewport({ scale: 1.2 }); // slightly optimized
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          canvas,
          viewport,
        }).promise;

        // ✅ memory optimized
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

      <h1 className="text-2xl font-bold text-center mb-6 tracking-wide">
        PDF Viewer
      </h1>

      <div className="bg-slate-800 p-4 rounded-xl shadow mb-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>

      {fileName && (
        <div className="text-center mb-3">
          <p className="text-sm text-gray-400">{fileName}</p>
          <p className="text-xs text-gray-500">
            {totalPages} page(s)
          </p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-center mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-center mb-3">{success}</p>
      )}

      {loading && (
        <p className="text-center text-gray-400 mb-3">
          Rendering...
        </p>
      )}

      {pages.length > 0 && (
        <button
          onClick={resetViewer}
          className="w-full mb-3 bg-red-500 py-2 rounded-lg text-sm"
        >
          Reset
        </button>
      )}

      <div className="space-y-4 mt-4">
        {pages.map((img, i) => (
          <div key={i} className="bg-slate-800 p-2 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">
              Page {i + 1}
            </p>
            <img
              src={img}
              className="w-full rounded-lg shadow"
              alt={`page-${i + 1}`}
            />
          </div>
        ))}
      </div>

    </div>
  );
}