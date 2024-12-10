/**
 * Folder Management Library
 * Handles creation and management of student folders with company ID support
 */

/**
 * Creates folder manager instance
 */
function createFolderManager(config) {
  return {
    createStudentFolders: function(studentData) {
      const results = {};

      try {
        // Format student identifiers
        const formattedId = studentData.studentId.toString().padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');
        const folderName = `${studentData.companyId}+${formattedId}+${formattedName}`;

        // Create main folder structure
        const companyFolder = DriveApp.getFolderById(config.COMPANIES_ROOT_ID);
        const mainFolder = companyFolder.createFolder(folderName);
        results.mainFolderId = mainFolder.getId();

        // Create subfolders
        const subfolders = ['slides', 'forms', 'sheets', 'docs', 'drive', 'gmail'];
        subfolders.forEach(subfolder => {
          const newFolder = mainFolder.createFolder(subfolder);
          results[`${subfolder}FolderId`] = newFolder.getId();
        });

        return results;

      } catch (error) {
        throw new Error(`Failed to create folders: ${error.message}`);
      }
    }
  };
}
