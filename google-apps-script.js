// ============================================================
// GOOGLE APPS SCRIPT — Deploy as Web App
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

    const fileId = file.getId();
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        fileId: fileId,
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const teacherName = e.parameter.teacherName;
    const courseName = e.parameter.courseName;
    const lectureName = e.parameter.lectureName;
    const fileId = e.parameter.fileId;

    const rootFolderName = "aetherix-data";
    const rootFolders = DriveApp.getFoldersByName(rootFolderName);
    if (!rootFolders.hasNext()) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Root folder not found" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    const rootFolder = rootFolders.next();

    if (action === "deleteFile") {
      if (!fileId) throw new Error("Missing fileId");
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      return successResponse("File deleted");
    }

    if (action === "deleteLecture") {
      if (!teacherName || !courseName || !lectureName) throw new Error("Missing parameters");
      const teacherFolder = getFolderByName(rootFolder, teacherName);
      if (!teacherFolder) return successResponse("Teacher folder not found");
      const courseFolder = getFolderByName(teacherFolder, courseName);
      if (!courseFolder) return successResponse("Course folder not found");
      const lectureFolder = getFolderByName(courseFolder, lectureName);
      if (!lectureFolder) return successResponse("Lecture folder not found");
      lectureFolder.setTrashed(true);
      return successResponse("Lecture folder deleted");
    }

    if (action === "deleteCourse") {
      if (!teacherName || !courseName) throw new Error("Missing parameters");
      const teacherFolder = getFolderByName(rootFolder, teacherName);
      if (!teacherFolder) return successResponse("Teacher folder not found");
      const courseFolder = getFolderByName(teacherFolder, courseName);
      if (!courseFolder) return successResponse("Course folder not found");
      courseFolder.setTrashed(true);

      const courseFolders = teacherFolder.getFolders();
      let hasCourses = false;
      while (courseFolders.hasNext()) {
        const f = courseFolders.next();
        if (!f.isTrashed()) { hasCourses = true; break; }
      }
      if (!hasCourses) {
        teacherFolder.setTrashed(true);
        return successResponse("Course and teacher folder deleted");
      }
      return successResponse("Course folder deleted");
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: "Unknown action" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getFolderByName(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : null;
}

function successResponse(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: message })
  ).setMimeType(ContentService.MimeType.JSON);
}
