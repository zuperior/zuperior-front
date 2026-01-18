"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  size?: number;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  size = 14,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div onClick={handleCopy} className={`cursor-pointer ${className}`}>
      {copied ? <Check size={size} className="text-green-500" /> : <Copy size={size} className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" />}
    </div>
  );
};
