/**
 * Logs Management Library
 * Handles logging of operations with company ID support
 */

/**
 * Creates logs manager instance
 */
function createLogsManager(config) {
  return {
    logSuccess: function(studentData, folderIds, spreadsheetId) {
      try {
        const spreadsheet = SpreadsheetApp.openById(config.CONTROL_SPREADSHEET_ID);
        const sheet = spreadsheet.getActiveSheet();

        const formattedId = studentData.studentId.toString().padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');

        const row = [
          new Date(),
          studentData.companyId,
          formattedId,
          formattedName,
          studentData.email,
          studentData.batch,
          folderIds.mainFolderId,
          spreadsheetId,
          'Success'
        ];

        sheet.appendRow(row);

      } catch (error) {
        console.error(`Failed to log success: ${error.message}`);
      }
    },

    logError: function(studentData, error) {
      try {
        const spreadsheet = SpreadsheetApp.openById(config.CONTROL_SPREADSHEET_ID);
        const sheet = spreadsheet.getActiveSheet();

        const formattedId = studentData.studentId.toString().padStart(4, '0');
        const formattedName = studentData.name.toLowerCase().replace(/\s+/g, '_');

        const row = [
          new Date(),
          studentData.companyId,
          formattedId,
          formattedName,
          studentData.email,
          studentData.batch,
          '',
          '',
          `Error: ${error.message}`
        ];

        sheet.appendRow(row);

      } catch (logError) {
        console.error(`Failed to log error: ${logError.message}`);
      }
    }
  };
}
