import { CheckCircle2, AlertCircle, Loader2, FileIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatBytes, formatSpeed } from "@/lib/format";
import type { UploadItem } from "@/lib/uploader";

export function UploadQueue({ items }: { items: UploadItem[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border bg-card shadow-soft">
      <div className="border-b px-4 py-3 text-sm font-semibold">
        Uploads ({items.filter(i => i.status === "done").length}/{items.length})
      </div>
      <ul className="max-h-80 divide-y overflow-auto scrollbar-thin">
        {items.map((it) => {
          const pct = it.size ? Math.round((it.loaded / it.size) * 100) : 0;
          return (
            <li key={it.id} className="flex items-center gap-3 px-4 py-3">
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium" title={it.relPath}>{it.relPath}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(it.size)}{it.status === "uploading" && ` · ${formatSpeed(it.speed)}`}
                  </span>
                </div>
                <Progress value={it.status === "done" ? 100 : pct} className="mt-2 h-1.5" />
                {it.status === "error" && <p className="mt-1 text-xs text-destructive">{it.error}</p>}
              </div>
              <div className="shrink-0">
                {it.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {it.status === "done" && <CheckCircle2 className="h-4 w-4 text-primary" />}
                {it.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
