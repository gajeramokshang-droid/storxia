import { useRef, useState, type DragEvent } from "react";
import { FolderUp, Files } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onFiles: (files: { file: File; relPath: string }[]) => void;
}

async function walkEntry(entry: any, path: string): Promise<{ file: File; relPath: string }[]> {
  if (entry.isFile) {
    return new Promise((resolve) => entry.file((f: File) => resolve([{ file: f, relPath: path + f.name }])));
  }
  if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries: any[] = await new Promise((res) => reader.readEntries(res));
    const all = await Promise.all(entries.map((e) => walkEntry(e, path + entry.name + "/")));
    return all.flat();
  }
  return [];
}

export function UploadDropzone({ onFiles }: Props) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const items = Array.from(e.dataTransfer.items);
    const all: { file: File; relPath: string }[] = [];
    for (const it of items) {
      const entry = (it as any).webkitGetAsEntry?.();
      if (entry) all.push(...(await walkEntry(entry, "")));
      else {
        const f = it.getAsFile();
        if (f) all.push({ file: f, relPath: f.name });
      }
    }
    if (all.length) onFiles(all);
  };

  const handleFolderPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onFiles(files.map((f) => ({ file: f, relPath: (f as any).webkitRelativePath || f.name })));
    e.target.value = "";
  };
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onFiles(files.map((f) => ({ file: f, relPath: f.name })));
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`group relative rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
        dragging ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-surface shadow-soft"
      }`}
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand shadow-glow transition-transform group-hover:scale-105">
        <FolderUp className="h-8 w-8 text-white" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">Drop a folder or files here</h3>
      <p className="mt-1 text-sm text-muted-foreground">Folder structure is preserved. Any file type. Up to 50 MB per file.</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => folderInputRef.current?.click()} className="gap-2">
          <FolderUp className="h-4 w-4" /> Choose folder
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
          <Files className="h-4 w-4" /> Choose files
        </Button>
      </div>
      <input
        ref={folderInputRef} type="file" hidden multiple onChange={handleFolderPick}
        // @ts-expect-error non-standard
        webkitdirectory="" directory=""
      />
      <input ref={fileInputRef} type="file" hidden multiple onChange={handleFilePick} />
    </div>
  );
}
