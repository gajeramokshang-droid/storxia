import { FileText, FileImage, FileVideo, FileArchive, FileCode, FileAudio, File, MoreVertical, Download, Trash2, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { formatBytes, fileKind } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type FileRow = Tables<"files">;

const kindIcon = {
  image: FileImage, video: FileVideo, pdf: FileText, audio: FileAudio,
  code: FileCode, archive: FileArchive, doc: FileText, other: File,
} as const;

const kindColor = {
  image: "text-emerald-500 bg-emerald-500/10",
  video: "text-rose-500 bg-rose-500/10",
  pdf: "text-red-500 bg-red-500/10",
  audio: "text-violet-500 bg-violet-500/10",
  code: "text-amber-500 bg-amber-500/10",
  archive: "text-orange-500 bg-orange-500/10",
  doc: "text-sky-500 bg-sky-500/10",
  other: "text-muted-foreground bg-muted",
} as const;

interface Props {
  file: FileRow;
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileCard({ file, onPreview, onDownload, onRename, onDelete }: Props) {
  const k = fileKind(file.name, file.mime_type);
  const Icon = kindIcon[k];
  return (
    <div className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className={`grid h-12 w-12 place-items-center rounded-lg ${kindColor[k]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <button onClick={onPreview} className="mt-3 truncate text-left text-sm font-medium hover:underline" title={file.name}>
        {file.name}
      </button>
      <div className="mt-0.5 truncate text-xs text-muted-foreground" title={file.rel_path}>
        {file.rel_path.includes("/") ? file.rel_path.split("/").slice(0, -1).join("/") : "/"}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatBytes(file.size)}</span>
        <span className="uppercase">{k}</span>
      </div>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
