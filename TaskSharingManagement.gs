/**
 * Task Sharing Management Library
 * Handles all task file operations for students
 */
if (typeof exports !== 'undefined') {
  global.DriveApp = {
    getFolderById: () => {},
    getFileById: () => {}
  };
}

function createTaskManager(config) {
  return {
    config: config,
    results: [],
    errors: [],

    /**
     * Validate student data format
     */
    validateStudentData: function(studentData) {
      // Validate Company ID format (C### pattern)
      if (!studentData.Company_ID || !/^C\d{3}$/.test(studentData.Company_ID)) {
        this.errors.push(`Invalid Company ID format for ${studentData.name || 'unknown student'}. Expected format: C### (e.g., C001)`);
        return false;
      }

      // Validate Student ID format (0001 pattern - 4 digits, zero-padded)
      if (!studentData.Student_ID || !/^\d{4}$/.test(studentData.Student_ID)) {
        this.errors.push(`Invalid Student ID format for ${studentData.name || 'unknown student'}. Expected format: #### (e.g., 0001)`);
        return false;
      }

      // Validate other required fields
      if (!studentData.name || !studentData.email) {
        this.errors.push(`Missing required student data for ${studentData.name || 'unknown student'}`);
        return false;
      }

      return true;
    },

    /**
     * Main function to setup all task files for a student
     */
    setupStudentTasks: function(studentData, studentFolderIds) {
      try {
        // Validate student data format first
        if (!this.validateStudentData(studentData)) {
          return {
            success: false,
            results: this.results,
            errors: this.errors,
            processedFiles: null
          };
        }

        const processedFiles = {
          copied: [],
          shared: []
        };

        // 1. Check and handle file copy
        const targetFolder = DriveApp.getFolderById(
          studentFolderIds.subfolderIds[this.config.COPY_FILE.targetSubfolder]
        );

        // Check if file already exists in student's folder
        const fileName = `${studentData.Company_ID}+${studentData.Student_ID}+${this.config.COPY_FILE.name}`;
        const existingFiles = targetFolder.getFilesByName(fileName);

        if (existingFiles.hasNext()) {
          this.results.push(`✓ File ${fileName} already exists for ${studentData.name}`);
        } else {
          // Copy file if it doesn't exist
          const copyResult = this.copyFileToStudent(
            this.config.COPY_FILE,
            studentData,
            studentFolderIds
          );
          if (copyResult.success) {
            processedFiles.copied.push({
              name: fileName,
              id: copyResult.fileId,
              companyId: studentData.Company_ID,
              studentId: studentData.Student_ID
            });
          }
        }

        // 2. Check and handle file sharing
        this.config.SHARE_FILES.forEach(fileConfig => {
          const shareResult = this.shareFileWithStudent(fileConfig, studentData);
          if (shareResult.success && !shareResult.alreadyExists) {
            processedFiles.shared.push({
              name: `${studentData.Company_ID}+${studentData.Student_ID}+${fileConfig.name}`,
              id: shareResult.fileId,
              companyId: studentData.Company_ID,
              studentId: studentData.Student_ID
            });
          }
        });

        return {
          success: true,
          results: this.results,
          errors: this.errors,
          processedFiles: processedFiles
        };

      } catch (error) {
        this.errors.push(`Failed to setup tasks for student ${studentData.name}: ${error.toString()}`);
        return {
          success: false,
          results: this.results,
          errors: this.errors,
          processedFiles: null
        };
      }
    },

    /**
     * Copy a file to student's folder
     */
    copyFileToStudent: function(fileConfig, studentData, studentFolderIds) {
      try {
        const sourceFile = DriveApp.getFileById(fileConfig.fileId);
        const targetFolder = DriveApp.getFolderById(
          studentFolderIds.subfolderIds[fileConfig.targetSubfolder]
        );

        const fileName = `${studentData.Company_ID}+${studentData.Student_ID}+${fileConfig.name}`;
        const newFile = sourceFile.makeCopy(targetFolder);
        newFile.setName(fileName);

        if (fileConfig.permission === 'edit') {
          newFile.addEditor(studentData.email);
        } else {
          newFile.addViewer(studentData.email);
        }

        this.results.push(`✓ Created and shared ${fileName} for ${studentData.name}`);

        return {
          success: true,
          fileId: newFile.getId()
        };

      } catch (error) {
        this.errors.push(`Failed to copy file for ${studentData.name}: ${error.toString()}`);
        return {
          success: false,
          fileId: null
        };
      }
    },

    /**
     * Share a file with student
     */
    shareFileWithStudent: function(fileConfig, studentData) {
      try {
        const file = DriveApp.getFileById(fileConfig.fileId);
        const fileName = `${studentData.Company_ID}+${studentData.Student_ID}+${fileConfig.name}`;

        // Check existing permissions
        const viewers = file.getViewers().map(viewer => viewer.getEmail());
        const editors = file.getEditors().map(editor => editor.getEmail());

        // If they already have the correct access level, skip
        if ((fileConfig.permission === 'view' && viewers.includes(studentData.email)) ||
            (fileConfig.permission === 'edit' && editors.includes(studentData.email))) {
          this.results.push(`✓ Student ${studentData.name} already has ${fileConfig.permission} access to ${fileName}`);
          return {
            success: true,
            fileId: file.getId(),
            alreadyExists: true
          };
        }

        // Add new permission only if needed
        if (fileConfig.permission === 'edit') {
          file.addEditor(studentData.email);
        } else {
          file.addViewer(studentData.email);
        }

        this.results.push(`✓ Granted ${fileConfig.permission} access to ${fileName} for ${studentData.name}`);

        return {
          success: true,
          fileId: file.getId(),
          alreadyExists: false
        };

      } catch (error) {
        this.errors.push(`Failed to share ${fileConfig.name} with ${studentData.name}: ${error.toString()}`);
        return {
          success: false,
          fileId: null
        };
      }
    },

    /**
     * Clean up results array to prevent duplicates
     */
    cleanResults: function() {
      this.results = [...new Set(this.results)];
      this.errors = [...new Set(this.errors)];
    }
  };
}

if (typeof exports !== 'undefined') {
  module.exports = { createTaskManager };
}
