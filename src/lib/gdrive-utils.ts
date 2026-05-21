export function getDriveFileId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getDriveEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const id = getDriveFileId(url);
  if (!id) return url;
  return `https://docs.google.com/gview?url=https://drive.google.com/uc?export=view&id=${id}&embedded=true`;
}

export function getDriveDownloadUrl(url: string | null): string | null {
  const id = getDriveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}
