import { supabase } from "@/integrations/supabase/client";

export interface UploadItem {
  id: string;
  file: File;
  relPath: string; // e.g. "MyFolder/sub/file.png" or just "file.png"
  size: number;
  loaded: number;
  speed: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

export async function ensureFolderPath(userId: string, relDir: string): Promise<string | null> {
  // relDir like "MyFolder/sub" — returns leaf folder id (or null for root)
  if (!relDir) return null;
  const parts = relDir.split("/").filter(Boolean);
  let parentId: string | null = null;
  let path = "";
  for (const name of parts) {
    path = path ? `${path}/${name}` : name;
    // Find existing
    const { data: existing } = await supabase
      .from("folders").select("id").eq("user_id", userId).eq("path", path).maybeSingle();
    if (existing) { parentId = existing.id; continue; }
    const ins = await supabase
      .from("folders").insert({ user_id: userId, name, parent_id: parentId, path })
      .select("id").single();
    if (ins.error) throw ins.error;
    parentId = (ins.data as { id: string }).id;
  }
  return parentId;
}

export async function uploadFile(
  userId: string,
  item: UploadItem,
  onProgress: (loaded: number, total: number, speed: number) => void,
): Promise<void> {
  const relDir = item.relPath.includes("/") ? item.relPath.split("/").slice(0, -1).join("/") : "";
  const folderId = await ensureFolderPath(userId, relDir);

  const storagePath = `${userId}/${crypto.randomUUID()}-${item.file.name}`;

  // Use XHR for progress events (supabase-js v2 doesn't expose progress)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/uploads/${storagePath}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");
    const start = Date.now();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const elapsed = (Date.now() - start) / 1000;
        const speed = elapsed > 0 ? e.loaded / elapsed : 0;
        onProgress(e.loaded, e.total, speed);
      }
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`)));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(item.file);
  });

  const { error } = await supabase.from("files").insert({
    user_id: userId,
    folder_id: folderId,
    name: item.file.name,
    rel_path: item.relPath,
    size: item.file.size,
    mime_type: item.file.type || null,
    storage_path: storagePath,
  });
  if (error) throw error;
}
