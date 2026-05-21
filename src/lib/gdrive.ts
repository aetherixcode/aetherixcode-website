const SCRIPT_URL = import.meta.env.PUBLIC_GDRIVE_SCRIPT_URL;

export async function uploadToDrive(file: File, teacherName: string, courseName: string, lectureName: string): Promise<{ downloadUrl: string; previewUrl: string }> {
  if (!SCRIPT_URL) throw new Error("Google Drive script URL not configured");

  const base64 = await fileToBase64(file);

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      file: base64,
      fileName: file.name,
      fileType: file.type,
      teacherName,
      courseName,
      lectureName,
    }),
  });

  const data = await response.json();

  if (!data.success) throw new Error(data.error || "Upload failed");

  return { downloadUrl: data.downloadUrl, previewUrl: data.previewUrl };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
