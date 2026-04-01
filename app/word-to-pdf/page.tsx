"use client";

import { useState } from "react";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function WordToPDF() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];

    if (!selected || !selected.name.endsWith(".docx")) {
      setError("⚠️ Upload a valid .docx file");
      setFile(null);
      return;
    }

    setError("");
    setSuccess("");
    setFile(selected);
  };

  const convert = async () => {
    if (!file) {
      setError("⚠️ Upload file first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const arrayBuffer = await file.arrayBuffer();

      const result = await mammoth.extractRawText({ arrayBuffer });

      let text = result.value || "";

      if (!text.trim()) {
        text = "⚠️ No readable content found";
      }

      const pdf = new jsPDF();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;

      const lines = pdf.splitTextToSize(text, usableWidth);

      let y = 10;

      lines.forEach((line: string) => {
        if (y > 280) {
          pdf.addPage();
          y = 10;
        }

        pdf.text(line, margin, y);
        y += 7;
      });

      const blob = pdf.output("blob");

      await saveFile(blob, `converted-${Date.now()}.pdf`);

      setSuccess("✅ Conversion completed!");

    } catch (err) {
      console.error(err);
      setError("❌ Conversion failed (file too complex)");
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

      // ✅ Android fix (same everywhere)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "PDF Ready",
        text: "Your converted PDF is ready",
        url: result.uri,
      });

    } catch (err) {
      console.error(err);
      setError("❌ Save failed");
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
        Word → PDF (Basic)
      </h1>

      <div className="bg-slate-800 p-4 rounded-xl shadow mb-4">
        <input
          type="file"
          accept=".docx"
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>

      {file && (
        <p className="text-sm text-gray-400 mb-2 text-center">
          {file.name}
        </p>
      )}

      {error && (
        <p className="text-red-400 text-center mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-center mb-3">{success}</p>
      )}

      <button
        onClick={convert}
        disabled={loading}
        className="w-full bg-blue-500 py-3 rounded-xl font-semibold hover:bg-blue-600 transition active:scale-95 disabled:opacity-50"
      >
        Convert to PDF
      </button>
    </div>
  );
}