/**
 * Folder Management Library
 * Handles all folder operations
 */

function createFolderManager(config) {
  return {
    config: config,
    results: [],
    errors: [],

    /**
     * Creates student folders with updated naming convention including company ID
     */
    createStudentFolders: function(studentData) {
      try {
        // Format student identifiers for folder names
        const formattedId = String(studentData.studentId).padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');
        const studentFolderName = `${studentData.companyId}+${formattedId}+${formattedName}`;

        // Get or create batch folder
        const batchFolder = this.getOrCreateBatchFolder(studentData.batch);

        // Create main student folder
        const studentFolder = batchFolder.createFolder(studentFolderName);

        // Create subfolders for different resource types
        const subfolderIds = {
          slides: this.createSubfolder(studentFolder, 'slides').getId(),
          forms: this.createSubfolder(studentFolder, 'forms').getId(),
          sheets: this.createSubfolder(studentFolder, 'sheets').getId(),
          docs: this.createSubfolder(studentFolder, 'docs').getId(),
          drive: this.createSubfolder(studentFolder, 'drive').getId(),
          gmail: this.createSubfolder(studentFolder, 'gmail').getId()
        };

        this.results.push(`✓ Created folders for student ${studentData.name}`);

        return {
          batchFolderId: batchFolder.getId(),
          studentFolderId: studentFolder.getId(),
          subfolderIds: subfolderIds
        };

      } catch (error) {
        this.errors.push(`Failed to create student folders: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Gets or creates a batch folder
     */
    getOrCreateBatchFolder: function(batchName) {
      try {
        const companiesFolder = DriveApp.getFolderById(this.config.COMPANIES_FOLDER_ID);
        const companyFolder = DriveApp.getFolderById(this.config.COMPANY_FOLDER_ID);

        // Look for existing batch folder
        const batchFolderIterator = companyFolder.getFoldersByName(batchName);

        if (batchFolderIterator.hasNext()) {
          return batchFolderIterator.next();
        }

        // Create new batch folder if it doesn't exist
        const batchFolder = companyFolder.createFolder(batchName);
        this.results.push(`✓ Created batch folder ${batchName}`);
        return batchFolder;

      } catch (error) {
        this.errors.push(`Failed to get/create batch folder: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Creates a subfolder within the student folder
     */
    createSubfolder: function(parentFolder, name) {
      try {
        const folder = parentFolder.createFolder(name);
        this.results.push(`✓ Created ${name} folder`);
        return folder;
      } catch (error) {
        this.errors.push(`Failed to create ${name} folder: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Deletes a folder and all its contents
     */
    deleteFolder: function(folderId) {
      try {
        const folder = DriveApp.getFolderById(folderId);
        folder.setTrashed(true);
        this.results.push(`✓ Deleted folder ${folder.getName()}`);
      } catch (error) {
        this.errors.push(`Failed to delete folder: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Gets folder by name from parent folder
     */
    getFolderByName: function(parentFolderId, name) {
      try {
        const parentFolder = DriveApp.getFolderById(parentFolderId);
        const folderIterator = parentFolder.getFoldersByName(name);

        if (folderIterator.hasNext()) {
          return folderIterator.next();
        }

        return null;
      } catch (error) {
        this.errors.push(`Failed to get folder by name: ${error.toString()}`);
        throw error;
      }
    }
  };
}
