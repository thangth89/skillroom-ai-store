"use client";

import { useEffect, useState } from "react";

export function CopyValueButton({
  value,
  label,
  copiedLabel = "Copied",
}: {
  value: string;
  label: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="secondary-button copy-value-button" onClick={copyValue} type="button">
      {copied ? `✓ ${copiedLabel}` : label}
    </button>
  );
}
