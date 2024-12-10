/**
 * Task Sharing Management Library
 * Handles task assignments and permissions with company ID support
 */

/**
 * Creates task manager instance
 */
function createTaskManager(config) {
  return {
    setupStudentTasks: function(studentData, folderIds) {
      try {
        // Validate company ID format
        if (!config.COMPANY_ID_REGEX.test(studentData.companyId)) {
          throw new Error('Invalid company ID format');
        }

        // Format student identifiers
        const formattedId = studentData.studentId.toString().padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');

        // Set permissions on folders
        Object.values(folderIds).forEach(folderId => {
          const folder = DriveApp.getFolderById(folderId);
          folder.addEditor(studentData.email);
        });

        // Copy and share task templates
        const taskFolder = DriveApp.getFolderById(config.TASK_PDFS_ID);
        const targetFolder = DriveApp.getFolderById(folderIds.mainFolderId);

        const files = taskFolder.getFiles();
        while (files.hasNext()) {
          const file = files.next();
          const newFile = file.makeCopy(targetFolder);
          newFile.setName(`${studentData.companyId}+${formattedId}+${file.getName()}`);
          newFile.addViewer(studentData.email);
        }

        return true;

      } catch (error) {
        throw new Error(`Failed to setup tasks: ${error.message}`);
      }
    }
  };
}
