import { ArtworkStatus, STATUS_LABEL } from "@/lib/types";

const STYLE: Record<ArtworkStatus, string> = {
  available:
    "border-emerald-600/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-700/50 dark:bg-emerald-950/60 dark:text-emerald-300",
  reserved:
    "border-amber-600/40 bg-amber-500/10 text-amber-700 dark:border-amber-700/50 dark:bg-amber-950/60 dark:text-amber-300",
  sold: "border-line bg-raise text-faint",
};

export default function StatusBadge({ status }: { status: ArtworkStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide backdrop-blur-sm ${STYLE[status]}`}
    >
      {status === "available" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}
