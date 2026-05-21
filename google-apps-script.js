// ============================================================
// GOOGLE APPS SCRIPT — Deploy as Web App
// ============================================================
// HOW TO DEPLOY:
// 1. Go to https://script.google.com
// 2. New Project → paste this code
// 3. Save → Deploy → New Deployment
// 4. Type: Web App
// 5. Execute as: Me
// 6. Who has access: Anyone
// 7. Deploy → copy the Web App URL
// 8. Add to .env: PUBLIC_GDRIVE_SCRIPT_URL=<your-url>
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const base64Data = data.file;
    const fileName = data.fileName;
    const teacherName = data.teacherName;
    const courseName = data.courseName;
    const lectureName = data.lectureName;
    const fileType = data.fileType || "application/octet-stream";

    const rootFolderName = "aetherix-data";
    let rootFolder;
    const rootFolders = DriveApp.getFoldersByName(rootFolderName);
    if (rootFolders.hasNext()) {
      rootFolder = rootFolders.next();
    } else {
      rootFolder = DriveApp.createFolder(rootFolderName);
    }

    let teacherFolder;
    const teacherFolders = rootFolder.getFoldersByName(teacherName);
    if (teacherFolders.hasNext()) {
      teacherFolder = teacherFolders.next();
    } else {
      teacherFolder = rootFolder.createFolder(teacherName);
    }

    let courseFolder;
    const courseFolders = teacherFolder.getFoldersByName(courseName);
    if (courseFolders.hasNext()) {
      courseFolder = courseFolders.next();
    } else {
      courseFolder = teacherFolder.createFolder(courseName);
    }

    let lectureFolder;
    const lectureFolders = courseFolder.getFoldersByName(lectureName);
    if (lectureFolders.hasNext()) {
      lectureFolder = lectureFolders.next();
    } else {
      lectureFolder = courseFolder.createFolder(lectureName);
    }

    const decoded = Utilities.base64Decode(base64Data.split(",")[1] || base64Data);
    const blob = Utilities.newBlob(decoded, fileType, fileName);
    const file = lectureFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.getId()}`;
    const previewUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
    const embedUrl = `https://drive.google.com/file/d/${file.getId()}/preview`;

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        fileId: file.getId(),
        downloadUrl: downloadUrl,
        previewUrl: previewUrl,
        embedUrl: embedUrl,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
