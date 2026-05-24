import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CloudUpload, FolderTree, Eye, Shield, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && user) navigate({ to: "/dashboard" }); }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand shadow-glow">
            <CloudUpload className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-semibold">Stash</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-20">
        <section className="text-center">
          <span className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
            Drag a folder. Keep the structure. Done.
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance font-display text-5xl font-bold tracking-tight sm:text-6xl">
            The universal folder uploader for <span className="bg-brand bg-clip-text text-transparent">every file you own</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-muted-foreground">
            Upload entire directories — images, videos, PDFs, code, archives — with their structure preserved. Preview, search, and manage everything in one fast, modern workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="gap-2"><Link to="/signup"><CloudUpload className="h-4 w-4" />Start uploading free</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/login">I have an account</Link></Button>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FolderTree, title: "Folder structure preserved", body: "Drop a whole directory tree — nested folders are recreated exactly as they were on disk." },
            { icon: Zap, title: "Live progress & speed", body: "See per-file progress, transfer speed, and size in a clean real-time queue." },
            { icon: Eye, title: "Universal preview", body: "Open images, video, audio, PDFs, and code with syntax-friendly previews — no downloads needed." },
            { icon: Search, title: "Search & filter", body: "Find any file by name or type across your entire library in milliseconds." },
            { icon: Shield, title: "Secure by default", body: "Per-user isolation with row-level security. Only you see your files." },
            { icon: CloudUpload, title: "Any file type", body: "Documents, archives, source code, media — if it's a file, it uploads." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
