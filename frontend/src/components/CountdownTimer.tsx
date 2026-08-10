"use client";
import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
function remaining(endsAt: string) {
  return Math.max(0, new Date(endsAt).getTime() - Date.now());
}
export default function CountdownTimer({
  endsAt,
  compact = false,
}: {
  endsAt?: string;
  compact?: boolean;
}) {
  const [left, setLeft] = useState(() => (endsAt ? remaining(endsAt) : 0));
  useEffect(() => {
    if (!endsAt) return;
    queueMicrotask(() => setLeft(remaining(endsAt)));
    const timer = setInterval(() => setLeft(remaining(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);
  if (!endsAt || left <= 0) return null;
  const total = Math.floor(left / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const value = `${days ? `${days}j ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-red-600 font-black tabular-nums text-white ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-xs"}`}
    >
      <Clock3 size={compact ? 11 : 14} />
      Fin dans {value}
    </span>
  );
}
