"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button 
      onClick={handleCopy}
      className="press shrink-0 text-sm font-semibold h-9 px-4 rounded-full border transition-colors"
      style={{ 
        borderColor: "var(--rule)", 
        background: copied ? "var(--ink)" : "white",
        color: copied ? "white" : "var(--ink)"
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
