const assert = require('assert');

// Mock Google Apps Script environment
class MockFolder {
  constructor(name) {
    this.name = name;
    this.subfolders = new Map();
  }

  createFolder(name) {
    const folder = new MockFolder(name);
    this.subfolders.set(name, folder);
    return folder;
  }

  getId() {
    return `mock-folder-${this.name}`;
  }

  getName() {
    return this.name;
  }

  getFoldersByName(name) {
    return {
      hasNext: () => this.subfolders.has(name),
      next: () => this.subfolders.get(name)
    };
  }
}

global.DriveApp = {
  getFolderById: () => new MockFolder('root')
};

global.SpreadsheetApp = {
  openById: () => ({
    getId: () => 'mock-spreadsheet-id',
    getSheetByName: () => ({
      appendRow: () => {},
      getRange: () => ({
        setValues: () => {},
        setNumberFormat: () => {}
      })
    })
  })
};

global.PropertiesService = {
  getDocumentProperties: () => ({
    setProperties: () => {}
  })
};

// Load libraries
const fs = require('fs');
const csv = require('csv-parse/sync');

// Load test data
const testData = fs.readFileSync('test_data.csv');
const records = csv.parse(testData, { columns: true });

// Load library files
const folderManagementCode = fs.readFileSync('FolderManagement.gs', 'utf8');
const spreadsheetManagementCode = fs.readFileSync('SpreadsheetManagement.gs', 'utf8');

// Evaluate library code
eval(folderManagementCode);
eval(spreadsheetManagementCode);

// Test configuration
const config = {
  COMPANIES_FOLDER_ID: 'mock-companies-folder-id',
  COMPANY_FOLDER_ID: 'mock-company-folder-id',
  COMPANY_ADMIN_ID: 'mock-company-admin-id',
  CONTROL_SPREADSHEET_ID: 'mock-control-spreadsheet-id'
};

// Initialize managers
const folderManager = createFolderManager(config);
const spreadsheetManager = createSpreadsheetManager(config);

// Test cases
console.log('\n=== Running Tests ===\n');

let testsPassed = 0;
let totalTests = records.length;

records.forEach((record, index) => {
  console.log(`Test Case ${index + 1}: ${record['Full Name']}`);
  console.log('-------------------');

  try {
    // Test company ID format
    console.log('1. Testing company ID format...');
    assert.match(record.Company_ID, /^C\d{3}$/, 'Company ID must be in format C### (e.g., C001)');
    console.log('✓ Company ID format is valid');

    // Test student ID format
    console.log('2. Testing student ID format...');
    assert.match(record.Student_ID, /^\d{4}$/, 'Student ID must be 4 digits with leading zeros');
    console.log('✓ Student ID format is valid');

    // Test folder creation and naming
    console.log('3. Testing folder creation...');
    const studentData = {
      companyId: record.Company_ID,
      studentId: record.Student_ID,
      name: record['Full Name'],
      email: record.Email,
      batch: record.Batch
    };

    const folderResult = folderManager.createStudentFolders(studentData);
    const expectedFolderName = `${record.Company_ID}+${record.Student_ID}+${record['Full Name'].toLowerCase().replace(/\s+/g, '_')}`;
    assert.ok(folderResult.studentFolderId.includes(expectedFolderName), `Folder name should be ${expectedFolderName}`);
    console.log('✓ Folder creation and naming is valid');

    // Test spreadsheet creation and naming
    console.log('4. Testing spreadsheet creation...');
    const spreadsheetId = spreadsheetManager.createStudentSpreadsheet(studentData, 'mock-template-id');
    assert.ok(spreadsheetId, 'Spreadsheet should be created');
    console.log('✓ Spreadsheet creation is valid');

    testsPassed++;
    console.log('\n✓ All tests passed for this record!\n');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}\n`);
  }
});

console.log('=== Test Summary ===');
console.log(`Passed: ${testsPassed}/${totalTests} test cases`);
console.log(`Success Rate: ${(testsPassed/totalTests * 100).toFixed(2)}%\n`);
