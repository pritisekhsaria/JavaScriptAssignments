/**
 * Required OAuth Scopes:
 * https://www.googleapis.com/auth/documents.currentonly
 * https://www.googleapis.com/auth/drive
 * https://www.googleapis.com/auth/spreadsheets
 */

// Configuration for common functionality across all assignments
const COMMON_CONFIG = {
  PERMISSION_GUIDE_URL: 'YOUR_PERMISSION_GUIDE_URL_HERE',
  MASTER_SPREADSHEET_ID: '1KBjyvbp494YrPluMEAy8e7bfgnTyApgqh4KJgdOkXTQ'
};

/**
 * Creates and shows a custom menu in Google Docs UI
 */
function createCustomMenu() {
  const ui = DocumentApp.getUi();
  ui.createMenu('Check Assignment')
    .addItem('Check Assignment', 'runCheckFromDoc')
    .addSeparator()
    .addItem('Permission Guide', 'showPermissionGuideLink')
    .addToUi();
}

/**
 * Shows permission guide link in a modal dialog
 */
function showPermissionGuideLink() {
  const ui = DocumentApp.getUi();
  ui.alert(
    'Permission Guide',
    'Please visit this link for permission instructions:\n' + COMMON_CONFIG.PERMISSION_GUIDE_URL,
    ui.ButtonSet.OK
  );
}

/**
 * Shows permissions information
 */
function showPermissionsInfo() {
  const ui = DocumentApp.getUi();
  ui.alert(
    'Permissions Required',
    'This script requires access to:\n' +
    '1. Read and write access to Google Docs\n' +
    '2. Access to Google Drive\n' +
    '3. Access to Google Sheets',
    ui.ButtonSet.OK
  );
}

/**
 * Displays an error message with consistent formatting
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const ui = DocumentApp.getUi();
  ui.alert('❌ Error', message, ui.ButtonSet.OK);
}

/**
 * Gets current assignment data from the master spreadsheet
 * @param {string} docName - Name of the current document
 * @return {Object} Assignment data including number and required percentage
 */
function getCurrentAssignment(docName) {
  const spreadsheet = SpreadsheetApp.openById(COMMON_CONFIG.MASTER_SPREADSHEET_ID);
  const sheets = spreadsheet.getSheets();

  for (let sheet of sheets) {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;

    const headerRow = data[0];
    const cols = {
      assignmentNum: headerRow.indexOf('Assignment Number'),
      fileName: headerRow.indexOf('File Name'),
      percentage: headerRow.indexOf('Required Percentage'),
      status: headerRow.indexOf('Status')
    };

    if (Object.values(cols).includes(-1)) continue;

    const matchingRow = data.slice(1).find(row =>
      row[cols.fileName].toString().trim() === docName.trim() &&
      row[cols.status].toString().toLowerCase().trim() === 'active'
    );

    if (matchingRow) {
      return {
        assignmentNumber: matchingRow[cols.assignmentNum],
        requiredPercentage: matchingRow[cols.percentage]
      };
    }
  }
  return null;
}

/**
 * Gets next assignment data based on current assignment number
 * @param {number} currentAssignmentNum - Current assignment number
 * @return {Array} Array of next assignment file information
 */
function getNextAssignment(currentAssignmentNum) {
  if (!currentAssignmentNum) return null;

  const spreadsheet = SpreadsheetApp.openById(COMMON_CONFIG.MASTER_SPREADSHEET_ID);
  const sheets = spreadsheet.getSheets();

  for (let sheet of sheets) {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;

    const headerRow = data[0];
    const cols = {
      assignmentNum: headerRow.indexOf('Assignment Number'),
      sequence: headerRow.indexOf('File Sequence'),
      fileName: headerRow.indexOf('File Name'),
      fileId: headerRow.indexOf('File ID'),
      action: headerRow.indexOf('Action'),
      access: headerRow.indexOf('Access Level'),
      folder: headerRow.indexOf('Target Folder Name'),
      percentage: headerRow.indexOf('Required Percentage'),
      status: headerRow.indexOf('Status')
    };

    if (Object.values(cols).includes(-1)) continue;

    const nextAssignmentFiles = data.slice(1)
      .filter(row =>
        row[cols.assignmentNum] === currentAssignmentNum + 1 &&
        row[cols.status].toString().toLowerCase().trim() === 'active'
      )
      .sort((a, b) => a[cols.sequence] - b[cols.sequence])
      .map(row => ({
        assignmentNumber: row[cols.assignmentNum],
        sequence: row[cols.sequence],
        fileName: row[cols.fileName],
        fileId: row[cols.fileId],
        action: row[cols.action].toString().toLowerCase().trim(),
        accessLevel: row[cols.access].toString().toLowerCase().trim(),
        targetFolder: row[cols.folder],
        requiredPercentage: row[cols.percentage]
      }));

    if (nextAssignmentFiles.length > 0) return nextAssignmentFiles;
  }
  return null;
}

/**
 * Handles sharing and setup of next assignment files
 * @param {Document} currentDoc - Current Google Doc
 * @param {Array} nextAssignmentInfo - Array of next assignment file information
 * @return {boolean} Success status
 */
function handleNextAssignment(currentDoc, nextAssignmentInfo) {
  try {
    const studentFolder = DriveApp.getFileById(currentDoc.getId()).getParents().next();

    nextAssignmentInfo.forEach(fileInfo => {
      switch(fileInfo.action) {
        case 'copy':
          const sourceFile = DriveApp.getFileById(fileInfo.fileId);
          const newFile = sourceFile.makeCopy(fileInfo.fileName, studentFolder);
          if (fileInfo.accessLevel === 'editor') {
            newFile.addEditor(Session.getActiveUser().getEmail());
          }
          break;

        case 'share':
          const file = DriveApp.getFileById(fileInfo.fileId);
          if (fileInfo.accessLevel === 'viewer') {
            file.addViewer(Session.getActiveUser().getEmail());
          }
          break;
      }
    });

    return true;
  } catch(e) {
    console.error('Error in handleNextAssignment:', e);
    return false;
  }
}

/**
 * Displays assignment check results with emojis and formatting
 * @param {Array} results - Array of completed tasks
 * @param {Array} errors - Array of incomplete/incorrect tasks
 * @param {number} score - Current score
 * @param {number} percentage - Score percentage
 * @param {Array} nextAssignmentInfo - Next assignment information if available
 */
function displayResults(results, errors, score, percentage, nextAssignmentInfo) {
  const ui = DocumentApp.getUi();
  let message = '📋 Assignment Check Results\n\n';

  // Add completed tasks with green ticks
  if (results.length > 0) {
    message += '✅ Completed Tasks:\n';
    results.forEach(result => message += `✅ ${result}\n`);
    message += '\n';
  }

  // Add incomplete/incorrect tasks with red crosses
  if (errors.length > 0) {
    message += '❌ Incomplete Tasks:\n';
    errors.forEach(error => message += `❌ ${error}\n`);
    message += '\n';
  }

  // Add score summary
  message += `📊 Score Summary:\n`;
  message += `${score === results.length ? '✅' : '❌'} Score: ${score}\n`;
  message += `${percentage >= 100 ? '✅' : '❌'} Percentage: ${percentage.toFixed(2)}%\n\n`;

  // Add next assignment info if available
  if (nextAssignmentInfo) {
    message += `📝 Next Assignment:\n`;
    message += `✅ Your next assignment files will be shared automatically.\n`;
    message += `ℹ️ Please check your "Shared with me" folder in Google Drive.\n`;
    message += `ℹ️ If you don't see it, please refresh your Drive window.\n`;
  }

  ui.alert('Assignment Check Results', message, ui.ButtonSet.OK);
}

/**
 * Public methods exposed by the library
 * These methods are available for use across all assignments (200-500)
 */
function getPublicMethods() {
  return {
    // UI and Menu Functions
    createUI: createCustomMenu,
    showPermissionGuideLink: showPermissionGuideLink,
    showPermissionsInfo: showPermissionsInfo,

    // Assignment Data Functions
    getCurrentAssignment: getCurrentAssignment,
    getNextAssignment: getNextAssignment,

    // File Handling Functions
    handleNextAssignment: handleNextAssignment,

    // Display and Error Handling Functions
    displayResults: displayResults,
    displayError: displayError
  };
}
