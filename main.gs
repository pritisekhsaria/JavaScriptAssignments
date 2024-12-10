/**
 * Main Script
 * Handles student resource creation and management
 */

// Configuration object
const CONFIG = {
  // Folder IDs
  TRAINING_ROOT_ID: '0AAjfHRBHqTG-Uk9PVA',
  COMPANIES_FOLDER_ID: '19ilsru6jV9Oj9Vv5OJzwj9SWTWjci0yZ',
  COMPANY_FOLDER_ID: '12EO-8GkN0Y_KgfMJu5XgNHj4lCXDtra-',
  COMPANY_ADMIN_ID: '1csCqCxGa-8Res896uYsKKjVBOEP_ZSQJ',
  TRAINER_ADMIN_ID: '1qynN7ZRDttPaaaN-jOHwGg7Q0vaHgFrO',
  ASSIGNMENT_MASTER_ID: '1iEi0ApNrECvCJJBFxPPthcXFv6mjUiww',
  TASK_PDFS_ID: '17qKubT2cmTsdwyFJPEz9tRaEzqqAEb0J',
  TASK_RAW_DATA_ID: '1DJgwKVLx8aBbEqVkVvH6qcPlloZsw_n8',

  // Spreadsheet IDs
  STUDENT_DATABASE_ID: '1UDOOKV4pUlyKOHfwmyCq-AN31ryWAj9GHIokfZ_0swI',
  CONTROL_SPREADSHEET_ID: '1yH_242vGvkM3vVmQK4SB-gizmEBgXMzMUb6TB-1BkKo',
  TEMPLATE_SPREADSHEET_ID: 'your_template_spreadsheet_id',

  // Company Details
  COMPANY_NAME: 'dummy_company1'
};

/**
 * Main function to process student data and create resources
 */
function processStudents() {
  const managers = initializeManagers();
  const results = [];
  const errors = [];

  try {
    // Get student database
    const studentDb = SpreadsheetApp.openById(CONFIG.STUDENT_DATABASE_ID);
    const sheet = studentDb.getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const student = data[i];

      // Create student data object with company ID
      const studentData = {
        companyId: student[0],    // Company_ID (format: C001)
        studentId: student[1],    // Student_ID (format: 0001)
        name: student[2],         // Full Name
        email: student[3],        // Email
        batch: student[4]         // Batch
      };

      try {
        // Create student resources
        const folderIds = managers.folderManager.createStudentFolders(studentData);
        const scoreSheetId = managers.spreadsheetManager.createStudentSpreadsheet(
          studentData,
          CONFIG.TEMPLATE_SPREADSHEET_ID
        );

        // Log resource creation
        managers.logsManager.logResource({
          ...studentData,
          ...folderIds,
          scoreSheetId: scoreSheetId,
          status: 'Created'
        });

        results.push(`✓ Processed student ${studentData.name}`);

      } catch (error) {
        const errorMessage = `Failed to process student ${studentData.name}: ${error.toString()}`;
        errors.push(errorMessage);

        // Log error in resource creation
        managers.logsManager.logResource({
          ...studentData,
          status: `Error: ${error.toString()}`
        });
      }
    }

    displayResults('Student Processing Complete', results, errors);

  } catch (error) {
    errors.push(`Main process failed: ${error.toString()}`);
    displayResults('Process Failed', results, errors);
  }
}

/**
 * Initializes all manager objects
 */
function initializeManagers() {
  return {
    folderManager: createFolderManager(CONFIG),
    spreadsheetManager: createSpreadsheetManager(CONFIG),
    logsManager: createLogsManager(CONFIG)
  };
}

/**
 * Displays results in UI
 */
function displayResults(title, results, errors) {
  const ui = SpreadsheetApp.getUi();
  let message = '📋 Results:\n\n';

  if (results.length > 0) {
    message += '✅ Completed Successfully:\n' + results.join('\n') + '\n\n';
  }

  if (errors.length > 0) {
    message += '❌ Issues Found:\n' + errors.join('\n');
  }

  ui.alert(title, message, ui.ButtonSet.OK);
}

/**
 * Verifies setup and configuration
 */
function verifySetup() {
  const managers = initializeManagers();

  try {
    // Verify we're running from a shared drive
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(activeSpreadsheet.getId());
    const parents = file.getParents();

    if (!parents.hasNext() || !parents.next().isShareableByEditors()) {
      throw new Error('This script must be run from a shared drive');
    }

    // Setup logging structure
    managers.logsManager.setupControlSpreadsheet();

    // Format student database
    managers.logsManager.formatStudentDatabase();

    return true;

  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'Setup Failed',
      `Failed to verify setup: ${error.toString()}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return false;
  }
}
