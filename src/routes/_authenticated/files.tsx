import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileCard } from "@/components/FileCard";
import { FilePreview } from "@/components/FilePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { fileKind } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

type FileRow = Tables<"files">;

export const Route = createFileRoute("/_authenticated/files")({ component: FilesPage });

function FilesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [preview, setPreview] = useState<FileRow | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as FileRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      const matchQ = !q || f.name.toLowerCase().includes(q) || f.rel_path.toLowerCase().includes(q);
      const matchK = filter === "all" || fileKind(f.name, f.mime_type) === filter;
      return matchQ && matchK;
    });
  }, [files, search, filter]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["files"] });

  const handleDownload = async (f: FileRow) => {
    const { data } = await supabase.storage.from("uploads").createSignedUrl(f.storage_path, 60, { download: f.name });
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };
  const handleRename = async (f: FileRow) => {
    const next = window.prompt("New name", f.name);
    if (!next || next === f.name) return;
    const { error } = await supabase.from("files").update({ name: next }).eq("id", f.id);
    if (error) toast.error(error.message); else { toast.success("Renamed"); refresh(); }
  };
  const handleDelete = async (f: FileRow) => {
    if (!confirm(`Delete "${f.name}"?`)) return;
    await supabase.storage.from("uploads").remove([f.storage_path]);
    const { error } = await supabase.from("files").delete().eq("id", f.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refresh(); qc.invalidateQueries({ queryKey: ["stats"] }); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Files</h1>
          <p className="text-sm text-muted-foreground">{files.length} file{files.length === 1 ? "" : "s"} in your library.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="w-64 pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
              <SelectItem value="doc">Documents</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border bg-card p-16 text-center shadow-soft">
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-display text-lg font-semibold">No files found</h3>
          <p className="mt-1 text-sm text-muted-foreground">{files.length === 0 ? "Upload a folder to get started." : "Try a different search or filter."}</p>
          {files.length === 0 && <Button asChild className="mt-4"><a href="/upload">Upload</a></Button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((f) => (
            <FileCard
              key={f.id} file={f}
              onPreview={() => setPreview(f)}
              onDownload={() => handleDownload(f)}
              onRename={() => handleRename(f)}
              onDelete={() => handleDelete(f)}
            />
          ))}
        </div>
      )}

      <FilePreview file={preview} open={!!preview} onOpenChange={(o) => !o && setPreview(null)} />
    </div>
  );
}
