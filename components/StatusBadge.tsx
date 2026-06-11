import { ArtworkStatus, STATUS_LABEL } from "@/lib/types";

const STYLE: Record<ArtworkStatus, string> = {
  available: "border-emerald-700/50 bg-emerald-950/60 text-emerald-300",
  reserved: "border-amber-700/50 bg-amber-950/60 text-amber-300",
  sold: "border-line bg-raise text-faint",
};

export default function StatusBadge({ status }: { status: ArtworkStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide ${STYLE[status]}`}
    >
      {status === "available" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}
