import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardDrive, Files as FilesIcon, FolderTree, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { formatBytes, fileKind } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: files }, { count: folderCount }] = await Promise.all([
        supabase.from("files").select("id, name, size, mime_type, created_at").order("created_at", { ascending: false }),
        supabase.from("folders").select("*", { count: "exact", head: true }),
      ]);
      const list = files ?? [];
      const totalSize = list.reduce((a, b) => a + (b.size ?? 0), 0);
      const recent = list.slice(0, 6);
      const byKind = list.reduce<Record<string, number>>((acc, f) => {
        const k = fileKind(f.name, f.mime_type);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});
      return { total: list.length, totalSize, folders: folderCount ?? 0, recent, byKind };
    },
  });

  const stats = [
    { label: "Storage used", value: formatBytes(data?.totalSize ?? 0), icon: HardDrive },
    { label: "Files", value: String(data?.total ?? 0), icon: FilesIcon },
    { label: "Folders", value: String(data?.folders ?? 0), icon: FolderTree },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">A quick look at your storage and recent activity.</p>
        </div>
        <Button asChild className="gap-2"><Link to="/upload"><Upload className="h-4 w-4" />Upload</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white"><s.icon className="h-4 w-4" /></div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{isLoading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-soft lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Recent uploads</h2>
          {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading…</p> :
            data?.recent.length ? (
              <ul className="mt-4 divide-y">
                {data.recent.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatBytes(f.size ?? 0)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-muted-foreground">No files yet. <Link to="/upload" className="text-primary hover:underline">Upload a folder</Link>.</p>
          }
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">By type</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data && Object.keys(data.byKind).length > 0 ? Object.entries(data.byKind).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="capitalize text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </li>
            )) : <li className="text-sm text-muted-foreground">No data yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
