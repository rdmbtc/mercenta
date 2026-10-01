import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[#7b42bc] px-2.5 py-1 rounded bg-[#7b42bc]/10 border border-[#7b42bc]/20">
          404 // Enclave Not Found
        </span>
        <h1 className="text-3xl font-light tracking-tight font-serif">
          Route Undefined
        </h1>
        <p className="text-sm text-[#b2b6bd]">
          The requested resource does not exist in the Mercenta policy registry.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-white text-black rounded hover:bg-white/90 transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Root Gateway
          </Link>
        </div>
      </div>
    </div>
  );
}
