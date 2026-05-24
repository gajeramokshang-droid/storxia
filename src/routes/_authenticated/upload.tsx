import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadDropzone } from "@/components/UploadDropzone";
import { UploadQueue } from "@/components/UploadQueue";
import { uploadFile, type UploadItem } from "@/lib/uploader";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/_authenticated/upload")({ component: UploadPage });

function UploadPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);

  const onFiles = async (incoming: { file: File; relPath: string }[]) => {
    if (!user) return;
    const newItems: UploadItem[] = incoming.map((x) => ({
      id: crypto.randomUUID(),
      file: x.file,
      relPath: x.relPath,
      size: x.file.size,
      loaded: 0,
      speed: 0,
      status: "queued",
    }));
    setItems((prev) => [...newItems, ...prev]);

    // Upload sequentially (chunked concurrency could be added; sequential keeps order + simple progress)
    const concurrency = 3;
    let cursor = 0;
    const update = (id: string, patch: Partial<UploadItem>) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

    const runOne = async () => {
      while (cursor < newItems.length) {
        const it = newItems[cursor++];
        update(it.id, { status: "uploading" });
        try {
          await uploadFile(user.id, it, (loaded, _t, speed) => update(it.id, { loaded, speed }));
          update(it.id, { status: "done", loaded: it.size });
        } catch (e) {
          update(it.id, { status: "error", error: (e as Error).message });
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, runOne));
    qc.invalidateQueries({ queryKey: ["files"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    toast.success("Upload complete");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Upload</h1>
        <p className="text-sm text-muted-foreground">Drop a folder, pick a folder, or pick individual files.</p>
      </div>
      <UploadDropzone onFiles={onFiles} />
      <UploadQueue items={items} />
    </div>
  );
}
