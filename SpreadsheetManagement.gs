/**
 * Spreadsheet Management Library
 * Handles all spreadsheet operations
 */

function createSpreadsheetManager(config) {
  return {
    config: config,
    results: [],
    errors: [],

    /**
     * Creates student score spreadsheet with updated naming convention including company ID
     */
    createStudentSpreadsheet: function(studentData, templateId) {
      try {
        // Format student identifiers for spreadsheet name
        const formattedId = String(studentData.studentId).padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');
        const spreadsheetName = `${studentData.companyId}+${formattedId}+${formattedName}_scores`;

        // Get the template spreadsheet
        const templateSpreadsheet = SpreadsheetApp.openById(templateId);

        // Get or create batch folder in company_admin
        const batchFolder = this.getOrCreateBatchFolder(studentData.batch);

        // Create new spreadsheet from template
        const newFile = DriveApp.getFileById(templateSpreadsheet.getId()).makeCopy(spreadsheetName, batchFolder);
        const newSpreadsheet = SpreadsheetApp.openById(newFile.getId());

        // Update spreadsheet properties
        this.updateSpreadsheetProperties(newSpreadsheet, studentData);

        this.results.push(`✓ Created score spreadsheet for student ${studentData.name}`);

        return newFile.getId();

      } catch (error) {
        this.errors.push(`Failed to create student spreadsheet: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Gets or creates a batch folder in company_admin
     */
    getOrCreateBatchFolder: function(batchName) {
      try {
        const companyAdminFolder = DriveApp.getFolderById(this.config.COMPANY_ADMIN_ID);

        // Look for existing batch folder
        const batchFolderIterator = companyAdminFolder.getFoldersByName(batchName);

        if (batchFolderIterator.hasNext()) {
          return batchFolderIterator.next();
        }

        // Create new batch folder if it doesn't exist
        const batchFolder = companyAdminFolder.createFolder(batchName);
        this.results.push(`✓ Created batch folder ${batchName} in company_admin`);
        return batchFolder;

      } catch (error) {
        this.errors.push(`Failed to get/create batch folder: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Updates spreadsheet properties with student data
     */
    updateSpreadsheetProperties: function(spreadsheet, studentData) {
      try {
        const properties = PropertiesService.getDocumentProperties();
        properties.setProperties({
          'studentId': studentData.studentId,
          'companyId': studentData.companyId,
          'studentName': studentData.name,
          'studentEmail': studentData.email,
          'batch': studentData.batch
        });

        this.results.push('✓ Updated spreadsheet properties');

      } catch (error) {
        this.errors.push(`Failed to update spreadsheet properties: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Deletes a spreadsheet
     */
    deleteSpreadsheet: function(spreadsheetId) {
      try {
        const file = DriveApp.getFileById(spreadsheetId);
        file.setTrashed(true);
        this.results.push(`✓ Deleted spreadsheet ${file.getName()}`);
      } catch (error) {
        this.errors.push(`Failed to delete spreadsheet: ${error.toString()}`);
        throw error;
      }
    }
  };
}
