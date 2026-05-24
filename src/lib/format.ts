export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function fileKind(name: string, mime?: string | null): "image" | "video" | "pdf" | "audio" | "code" | "archive" | "doc" | "other" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime?.startsWith("image/")) return "image";
  if (mime?.startsWith("video/")) return "video";
  if (mime?.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["js","jsx","ts","tsx","py","java","c","cpp","cs","rb","go","rs","php","html","css","json","yaml","yml","md","sh","sql"].includes(ext)) return "code";
  if (["doc","docx","xls","xlsx","ppt","pptx","txt"].includes(ext)) return "doc";
  return "other";
}
