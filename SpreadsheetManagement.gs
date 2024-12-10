/**
 * Spreadsheet Management Library
 * Handles creation and management of student spreadsheets with company ID support
 */

/**
 * Creates spreadsheet manager instance
 */
function createSpreadsheetManager(config) {
  return {
    createStudentSpreadsheet: function(studentData) {
      try {
        // Format student identifiers
        const formattedId = studentData.studentId.toString().padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');
        const spreadsheetName = `${studentData.companyId}+${formattedId}+${formattedName}_scores`;

        // Create spreadsheet in company admin folder
        const folder = DriveApp.getFolderById(config.COMPANY_ADMIN_ID);
        const spreadsheet = SpreadsheetApp.create(spreadsheetName);
        const file = DriveApp.getFileById(spreadsheet.getId());

        // Move to correct folder
        file.moveTo(folder);

        // Set up initial structure
        const sheet = spreadsheet.getActiveSheet();
        sheet.setName('Scores');
        sheet.getRange('A1:D1').setValues([['Task', 'Score', 'Date', 'Comments']]);

        return spreadsheet.getId();

      } catch (error) {
        throw new Error(`Failed to create spreadsheet: ${error.message}`);
      }
    }
  };
}
