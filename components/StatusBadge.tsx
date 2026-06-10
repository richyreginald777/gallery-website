import { ArtworkStatus, STATUS_LABEL } from "@/lib/types";

const STYLE: Record<ArtworkStatus, string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-neutral-200 text-neutral-600",
};

export default function StatusBadge({ status }: { status: ArtworkStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
