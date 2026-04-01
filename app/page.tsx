"use client";

import {
  FileImage,
  Layers,
  Minimize,
  PenTool,
  FileText,
  ImageIcon,
  Eye,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">

      {/* TOP */}
      <div>
        <h1 className="text-3xl font-bold text-center mb-2">
          📄 PDF Toolkit
        </h1>

        <p className="text-center text-xs text-gray-400 mb-1">
          Fast • Secure • Offline Tools
        </p>

        <p className="text-center text-xs text-gray-500 mb-8">
          No login • 100% offline • Works on your device
        </p>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">

          <Card title="Image → PDF" link="/image-to-pdf" icon={<FileImage size={20} />} />
          <Card title="Merge PDF" link="/merge-pdf" icon={<Layers size={20} />} />
          <Card title="Compress PDF" link="/compress-pdf" icon={<Minimize size={20} />} />
          <Card title="PDF Sign" link="/pdf-sign" icon={<PenTool size={20} />} />
          <Card title="Word → PDF" link="/word-to-pdf" icon={<FileText size={20} />} />
          <Card title="PDF → Image" link="/pdf-to-image" icon={<ImageIcon size={20} />} />
          <Card title="PDF Viewer" link="/pdf-viewer" icon={<Eye size={20} />} />

        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center mt-10 space-y-2">

        <div className="flex justify-center gap-3 text-[10px] text-gray-500 flex-wrap">
          <span>🔒 Private</span>
          <span>⚡ Fast</span>
          <span>📱 Mobile Ready</span>
        </div>

        <p className="text-xs text-gray-500">
          Works offline • Your files never leave your device
        </p>

        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} TitanArtStudio
        </p>
      </div>
    </div>
  );
}

function Card({ title, link, icon }: any) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(link)}
      className="
        w-full
        bg-slate-800/80 backdrop-blur-md 
        border border-slate-700 
        p-5 rounded-2xl text-center 
        shadow-lg
        hover:bg-slate-700/70
        transition
        active:scale-95
      "
    >
      <div className="flex justify-center mb-3 text-blue-400">
        {icon}
      </div>

      <p className="font-semibold text-sm tracking-wide">
        {title}
      </p>
    </button>
  );
}