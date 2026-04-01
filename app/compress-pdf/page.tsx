"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import imageCompression from "browser-image-compression";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import Loader from "@/components/Loader";

export default function CompressPDF() {
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validImages = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validImages.length === 0) {
      setError("⚠️ Please upload valid image files only");
      setImages([]);
      setPreviewUrls([]);
      return;
    }

    setError("");
    setSuccess("");
    setImages(validImages);

    const urls = validImages.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewUrls(urls);
  };

  const compressPDF = async () => {
    if (images.length === 0) {
      setError("⚠️ Upload images first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const pdf = new jsPDF();

    try {
      for (let i = 0; i < images.length; i++) {
        const file = images[i];

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Image too large (max 5MB)");
        }

        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: false,
          initialQuality: 0.6,
        });

        const imgData = await toBase64(compressed);

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);

        const pdfHeight =
          (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();

        const format = file.type.includes("png") ? "PNG" : "JPEG";

        pdf.addImage(imgData, format, 0, 0, pdfWidth, pdfHeight);
      }

      const pdfBlob = pdf.output("blob");

      await saveFile(pdfBlob, "compressed.pdf");

      setSuccess("✅ PDF created successfully!");

    } catch (err) {
      console.error(err);
      setError("❌ Compression failed (try smaller images)");
    }

    setLoading(false);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

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

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "PDF Ready",
        text: "Your compressed PDF is ready",
        url: result.uri,
      });

    } catch (err) {
      console.error(err);
      setError("❌ Failed to save file");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">

      {loading && <Loader />}

      <button
        onClick={() => (window.location.href = "/")}
        className="text-blue-400 mb-4 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-center mb-6 tracking-wide">
        Compress PDF (via Images)
      </h1>

      <div className="bg-slate-800 p-4 rounded-xl shadow mb-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="block w-full text-sm"
        />
      </div>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {previewUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              className="rounded-lg"
              alt="preview"
            />
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-center text-gray-400 text-sm mb-3">
          {images.length} files selected
        </p>
      )}

      {error && (
        <p className="text-red-400 text-center mb-3">{error}</p>
      )}

      {success && (
        <p className="text-green-400 text-center mb-3">{success}</p>
      )}

      <button
        onClick={compressPDF}
        disabled={loading}
        className="w-full bg-blue-500 py-3 rounded-xl font-semibold hover:bg-blue-600 transition active:scale-95 disabled:opacity-50"
      >
        Compress & Download
      </button>
    </div>
  );
}