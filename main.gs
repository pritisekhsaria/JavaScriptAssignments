/**
 * Main configuration and setup script
 */

const CONFIG = {
  // Company Information
  COMPANY_NAME: 'Example Company',
  COMPANY_ID: 'C001',  // Company ID in C### format
  COMPANY_ID_REGEX: /^C\d{3}$/,  // Validation pattern for company IDs

  // Root folder IDs
  TRAINING_ROOT_ID: '1XkaQRv7rwmM36QpFEzz5e_t6E5j3xG68',
  COMPANIES_ROOT_ID: '19ilsru6jV9Oj9Vv5OJzwj9SWTWjci0yZ',

  // Company specific folder IDs
  COMPANY_ADMIN_ID: '1csCqCxGa-8Res896uYsKKjVBOEP_ZSQJ',
  TRAINER_ADMIN_ID: '1qynN7ZRDttPaaaN-jOHwGg7Q0vaHgFrO',

  // Assignment folders
  ASSIGNMENT_MASTER_ID: '1iEi0ApNrECvCJJBFxPPthcXFv6mjUiww',
  TASK_PDFS_ID: '17qKubT2cmTsdwyFJPEz9tRaEzqqAEb0J',
  TASK_RAW_DATA_ID: '1DJgwKVLx8aBbEqVkVvH6qcPlloZsw_n8',

  // Spreadsheet IDs
  STUDENT_DATABASE_ID: '1UDOOKV4pUlyKOHfwmyCq-AN31ryWAj9GHIokfZ_0swI',
  CONTROL_SPREADSHEET_ID: '1yH_242vGvkM3vVmQK4SB-gizmEBgXMzMUb6TB-1BkKo'
};

/**
 * Creates menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Training Setup')
    .addItem('Initialize Setup', 'initializeSetup')
    .addItem('Create Student Resources', 'createStudentResources')
    .addToUi();
}

/**
 * Initializes the setup by checking core requirements
 */
function initializeSetup() {
  const results = [];
  const errors = [];

  try {
    // Verify we're running from a shared drive
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(activeSpreadsheet.getId());
    const parents = file.getParents();

    if (!parents.hasNext() || !parents.next().isShareableByEditors()) {
      throw new Error('This script must be run from a shared drive');
    }

    // Verify company name and ID are set
    if (!CONFIG.COMPANY_NAME) {
      throw new Error('Company name must be set in CONFIG');
    }
    if (!CONFIG.COMPANY_ID || !CONFIG.COMPANY_ID_REGEX.test(CONFIG.COMPANY_ID)) {
      throw new Error('Company ID must be set in CONFIG and match pattern C### (e.g., C001)');
    }

    // Verify critical folders exist
    verifyFolderExists('Training Root', CONFIG.TRAINING_ROOT_ID, results, errors);
    verifyFolderExists('Company Admin', CONFIG.COMPANY_ADMIN_ID, results, errors);
    verifyFolderExists('Trainer Admin', CONFIG.TRAINER_ADMIN_ID, results, errors);
    verifyFolderExists('Assignment Master', CONFIG.ASSIGNMENT_MASTER_ID, results, errors);
    verifyFolderExists('Task PDFs', CONFIG.TASK_PDFS_ID, results, errors);
    verifyFolderExists('Task Raw Data', CONFIG.TASK_RAW_DATA_ID, results, errors);

    // Verify spreadsheets
    verifySpreadsheetExists('Student Database', CONFIG.STUDENT_DATABASE_ID, results, errors);
    verifySpreadsheetExists('Control Spreadsheet', CONFIG.CONTROL_SPREADSHEET_ID, results, errors);

    displayResults('Setup Initialization', results, errors);
    return errors.length === 0;

  } catch (error) {
    errors.push(`Setup failed: ${error.toString()}`);
    displayResults('Setup Failed', results, errors);
    return false;
  }
}

/**
 * Creates student resources based on database entries
 */
function createStudentResources() {
  const results = [];
  const errors = [];

  try {
    // Initialize managers
    const folderManager = createFolderManager(CONFIG);
    const spreadsheetManager = createSpreadsheetManager(CONFIG);
    const taskManager = createTaskManager(CONFIG);
    const logsManager = createLogsManager(CONFIG);

    // Get student data from database
    const studentData = getStudentData();

    // Process each student
    studentData.forEach(student => {
      try {
        // Create folders and resources
        const folderIds = folderManager.createStudentFolders(student);
        const spreadsheetId = spreadsheetManager.createStudentSpreadsheet(student);
        const taskSetup = taskManager.setupStudentTasks(student, folderIds);

        // Log successful creation
        logsManager.logSuccess(student, folderIds, spreadsheetId);
        results.push(`✓ Created resources for ${student.name}`);

      } catch (error) {
        errors.push(`Failed to process student ${student.name}: ${error.toString()}`);
        logsManager.logError(student, error);
      }
    });

    displayResults('Resource Creation', results, errors);

  } catch (error) {
    errors.push(`Setup failed: ${error.toString()}`);
    displayResults('Setup Failed', results, errors);
  }
}

/**
 * Gets student data from database spreadsheet
 */
function getStudentData() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.STUDENT_DATABASE_ID);
  const sheet = spreadsheet.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Remove header row and map to student objects
  return data.slice(1).map(row => ({
    companyId: CONFIG.COMPANY_ID,
    studentId: row[0],
    name: row[1],
    email: row[2],
    batch: row[3]
  }));
}

/**
 * Utility function to verify folder exists and is accessible
 */
function verifyFolderExists(name, id, results, errors) {
  try {
    DriveApp.getFolderById(id);
    results.push(`✓ ${name} folder is accessible`);
  } catch (error) {
    errors.push(`❌ Cannot access ${name} folder: ${error.toString()}`);
  }
}

/**
 * Utility function to verify spreadsheet exists and is accessible
 */
function verifySpreadsheetExists(name, id, results, errors) {
  try {
    SpreadsheetApp.openById(id);
    results.push(`✓ ${name} spreadsheet is accessible`);
  } catch (error) {
    errors.push(`❌ Cannot access ${name} spreadsheet: ${error.toString()}`);
  }
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
