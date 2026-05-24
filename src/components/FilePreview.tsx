import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fileKind, formatBytes } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";

type FileRow = Tables<"files">;

export function FilePreview({ file, open, onOpenChange }: { file: FileRow | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !file) { setUrl(null); setText(null); return; }
    setLoading(true);
    (async () => {
      const { data } = await supabase.storage.from("uploads").createSignedUrl(file.storage_path, 3600);
      setUrl(data?.signedUrl ?? null);
      const k = fileKind(file.name, file.mime_type);
      if (k === "code" || file.mime_type?.startsWith("text/")) {
        try {
          const res = await fetch(data!.signedUrl);
          setText(await res.text());
        } catch { setText("Failed to load file."); }
      }
      setLoading(false);
    })();
  }, [open, file]);

  if (!file) return null;
  const k = fileKind(file.name, file.mime_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {file.mime_type || "unknown"}</p>
        </DialogHeader>
        <div className="min-h-[300px]">
          {loading && <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {!loading && url && k === "image" && <img src={url} alt={file.name} className="mx-auto max-h-[70vh] rounded-lg" />}
          {!loading && url && k === "video" && <video src={url} controls className="mx-auto max-h-[70vh] w-full rounded-lg" />}
          {!loading && url && k === "audio" && <audio src={url} controls className="w-full" />}
          {!loading && url && k === "pdf" && <iframe src={url} className="h-[70vh] w-full rounded-lg border" title={file.name} />}
          {!loading && text !== null && (k === "code" || file.mime_type?.startsWith("text/")) && (
            <pre className="max-h-[70vh] overflow-auto rounded-lg bg-muted p-4 text-xs scrollbar-thin"><code>{text}</code></pre>
          )}
          {!loading && url && !["image","video","audio","pdf","code"].includes(k) && !file.mime_type?.startsWith("text/") && (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">
              Preview not available for this file type.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
