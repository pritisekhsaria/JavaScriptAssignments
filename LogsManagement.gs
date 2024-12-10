/**
 * Logs Management Library
 * Handles all logging operations
 */

function createLogsManager(config) {
  return {
    config: config,
    results: [],
    errors: [],

    /**
     * Sets up control spreadsheet structure
     */
    setupControlSpreadsheet: function() {
      try {
        const ss = SpreadsheetApp.openById(this.config.CONTROL_SPREADSHEET_ID);

        // Setup Resources sheet
        this.setupResourcesSheet(ss);

        // Setup Permissions sheet
        this.setupPermissionsSheet(ss);

        // Setup Status sheet
        this.setupStatusSheet(ss);

        this.results.push('✓ Control spreadsheet structure verified');

      } catch (error) {
        this.errors.push(`Failed to setup control spreadsheet: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Sets up Resources sheet
     */
    setupResourcesSheet: function(ss) {
      let sheet = ss.getSheetByName('Resources');

      if (!sheet) {
        sheet = ss.insertSheet('Resources');

        // Set headers with Company ID
        const headers = [
          'Timestamp',
          'Company ID',
          'Student ID',
          'Name',
          'Email',
          'Batch',
          'Batch Folder ID',
          'Student Folder ID',
          'Slides Folder ID',
          'Forms Folder ID',
          'Sheets Folder ID',
          'Docs Folder ID',
          'Drive Folder ID',
          'Gmail Folder ID',
          'Score Sheet ID',
          'Status'
        ];

        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

        // Format timestamp column
        sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm:ss');

        // Format ID columns
        sheet.getRange('B:B').setNumberFormat('@STRING@');  // Company ID
        sheet.getRange('C:C').setNumberFormat('0000');      // Student ID

        // Freeze header row
        sheet.setFrozenRows(1);

        this.results.push('✓ Created Resources sheet');
      }
    },

    /**
     * Sets up Permissions sheet
     */
    setupPermissionsSheet: function(ss) {
      let sheet = ss.getSheetByName('Permissions');

      if (!sheet) {
        sheet = ss.insertSheet('Permissions');

        // Set headers with Company ID
        const headers = [
          'Timestamp',
          'Company ID',
          'Student ID',
          'Resource Type',
          'Resource ID',
          'Access Level',
          'Email',
          'Status',
          'Notes'
        ];

        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

        // Format timestamp column
        sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm:ss');

        // Format ID columns
        sheet.getRange('B:B').setNumberFormat('@STRING@');  // Company ID
        sheet.getRange('C:C').setNumberFormat('0000');      // Student ID

        // Freeze header row
        sheet.setFrozenRows(1);

        this.results.push('✓ Created Permissions sheet');
      }
    },

    /**
     * Sets up Status sheet
     */
    setupStatusSheet: function(ss) {
      // PLACEHOLDER: Status sheet setup implementation (unchanged)
    },

    /**
     * Formats student database
     */
    formatStudentDatabase: function() {
      // PLACEHOLDER: Student database formatting implementation (unchanged)
    },

    /**
     * Formats ID column to maintain leading zeros
     */
    formatIdColumn: function(sheet, column) {
      // PLACEHOLDER: ID column formatting implementation (unchanged)
    },

    /**
     * Formats student ID with leading zeros
     */
    formatStudentId: function(studentId) {
      // PLACEHOLDER: Student ID formatting implementation (unchanged)
    },

    /**
     * Logs resource creation/updates to control spreadsheet
     */
    logResource: function(resourceData) {
      try {
        const ss = SpreadsheetApp.openById(this.config.CONTROL_SPREADSHEET_ID);
        const sheet = ss.getSheetByName('Resources');
        const data = sheet.getDataRange().getValues();

        // Find if student already exists
        const formattedId = this.formatStudentId(resourceData.studentId);
        let studentRow = 0;

        for (let i = 1; i < data.length; i++) {
          if (data[i][2] === formattedId && data[i][1] === resourceData.companyId) {
            studentRow = i + 1;  // +1 because array is 0-based but sheet is 1-based
            break;
          }
        }

        // If student exists and we have updates, merge with existing data
        let existingData = null;
        if (studentRow > 0) {
          // PLACEHOLDER: Existing data handling implementation (unchanged)
        }


        const newRowData = [
          new Date(),
          resourceData.companyId,
          formattedId,
          resourceData.studentName,
          resourceData.email,
          resourceData.batch,
          resourceData.batchFolderId,
          resourceData.studentFolderId,
          resourceData.subfolderIds.slides || '',
          resourceData.subfolderIds.forms || '',
          resourceData.subfolderIds.sheets || '',
          resourceData.subfolderIds.docs || '',
          resourceData.subfolderIds.drive || '',
          resourceData.subfolderIds.gmail || '',
          resourceData.scoreSheetId,
          resourceData.status
        ];

        if (studentRow > 0) {
          // Update existing row
          sheet.getRange(studentRow, 1, 1, newRowData.length).setValues([newRowData]);
          this.results.push(`✓ Updated resources for student ${resourceData.studentName}`);
        } else {
          // Add new row
          sheet.appendRow(newRowData);
          this.results.push(`✓ Logged new resources for student ${resourceData.studentName}`);
        }

        // Format ID columns
        sheet.getRange('B:B').setNumberFormat('@STRING@');  // Company ID
        sheet.getRange('C:C').setNumberFormat('0000');      // Student ID

      } catch (error) {
        this.errors.push(`Failed to log resource: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Logs permission changes to control spreadsheet
     */
    logPermission: function(permissionData) {
      try {
        const ss = SpreadsheetApp.openById(this.config.CONTROL_SPREADSHEET_ID);
        const sheet = ss.getSheetByName('Permissions');

        const formattedId = this.formatStudentId(permissionData.studentId);

        sheet.appendRow([
          new Date(),
          permissionData.companyId,
          formattedId,
          permissionData.resourceType,
          permissionData.resourceId,
          permissionData.accessLevel,
          permissionData.email,
          permissionData.status,
          permissionData.notes
        ]);

        // Format ID columns
        sheet.getRange('B:B').setNumberFormat('@STRING@');  // Company ID
        sheet.getRange('C:C').setNumberFormat('0000');      // Student ID

        this.results.push(`✓ Logged permissions for student ID ${formattedId}`);

      } catch (error) {
        this.errors.push(`Failed to log permission: ${error.toString()}`);
        throw error;
      }
    },

    /**
     * Logs status updates to control spreadsheet
     */
    logStatus: function(statusData) {
      // PLACEHOLDER: Status logging implementation (unchanged)
    }
  };
}
