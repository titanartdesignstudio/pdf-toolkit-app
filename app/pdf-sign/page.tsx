"use client";

import { useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function PDFSign() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("Signed by Titan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("⚠️ Please upload a valid PDF file");
      setFile(null);
      return;
    }

    setError("");
    setSuccess("");
    setFile(selected);
  };

  const signPDF = async () => {
    if (!file) {
      setError("⚠️ Upload a PDF first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fileBytes = await file.arrayBuffer();

      const pdf = await PDFDocument.load(fileBytes);

      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      pages.forEach((page) => {
        const { width } = page.getSize();

        page.drawText(name || "Signed", {
          x: width - 180,
          y: 40,
          size: 14,
          font,
          color: rgb(1, 0, 0),
        });
      });

      const pdfBytes = await pdf.save();

      // ✅ SAFE BLOB FIX
      const safeBytes = new Uint8Array(pdfBytes);

      const blob = new Blob([safeBytes], {
        type: "application/pdf",
      });

      await saveFile(blob, `signed-${Date.now()}.pdf`);

      setSuccess("✅ PDF signed successfully!");

    } catch (err) {
      console.error(err);
      setError("❌ Failed to sign PDF");
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

      // ✅ Android stable
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "PDF Ready",
        text: "Your signed PDF is ready",
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
        ✍️ PDF Sign
      </h1>

      <div className="bg-slate-800 p-4 rounded-xl shadow mb-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter signature text"
        className="w-full mb-4 p-2 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {file && (
        <p className="text-sm text-gray-400 mb-2 text-center">
          📄 {file.name}
        </p>
      )}

      {error && (
        <p className="text-red-400 text-center mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-center mb-3">{success}</p>
      )}

      <button
        onClick={signPDF}
        disabled={loading}
        className="w-full bg-blue-500 py-3 rounded-xl font-semibold hover:bg-blue-600 transition active:scale-95 disabled:opacity-50"
      >
        Sign & Download
      </button>
    </div>
  );
}