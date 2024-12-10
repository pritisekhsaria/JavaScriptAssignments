// Import TaskSharingManagement
const { createTaskManager } = require('./TaskSharingManagement.gs');

// Mock file tracking for tests
const mockFiles = new Map();

// Mock DriveApp for testing
global.DriveApp = {
  getFolderById: (id) => ({
    getFilesByName: (name) => ({
      hasNext: () => mockFiles.has(name),
      next: () => mockFiles.get(name)
    })
  }),
  getFileById: (id) => {
    const mockFile = {
      makeCopy: (folder) => {
        const newFile = {
          id: `mock-file-${Date.now()}`,
          name: '',
          setName: function(name) {
            this.name = name;
            mockFiles.set(name, this);
            return this;
          },
          getId: function() {
            return this.id;
          },
          addEditor: (email) => {},
          addViewer: (email) => {}
        };
        return newFile;
      },
      getViewers: () => [],
      getEditors: () => [],
      addEditor: (email) => {},
      addViewer: (email) => {}
    };
    return mockFile;
  }
};

// Test data from test_data.csv
const testData = [
  {
    Company_ID: 'C001',
    Student_ID: '0001',
    name: 'folder_gmail',
    email: 'pritisekhsaria@gmail.com',
    batch: 'batch_one',
    status: 'docs'
  },
  {
    Company_ID: 'C001',
    Student_ID: '0002',
    name: 'folder_hotmail',
    email: 'priti_sekhsaria@hotmail.com',
    batch: 'batch_two',
    status: 'docs'
  },
  {
    Company_ID: 'C001',
    Student_ID: '0003',
    name: 'folder_codetutor',
    email: 'codetutor.co.in@gmail.com',
    batch: 'batch_one',
    status: 'docs'
  }
];

// Mock configuration for testing
const mockConfig = {
  COPY_FILE: {
    fileId: 'mock-source-file-id',
    name: 'assignment.doc',
    targetSubfolder: 'docs',
    permission: 'edit'
  },
  SHARE_FILES: [
    {
      fileId: 'mock-shared-file-id',
      name: 'shared_doc.doc',
      permission: 'view'
    }
  ]
};

// Test cases
function runTests() {
  console.log('Starting TaskSharingManagement.gs tests...\n');

  const results = [];
  const errors = [];

  // Clear mock files before each test run
  mockFiles.clear();

  // Test 1: File naming convention
  console.log('Test 1: File naming convention');
  testData.forEach(student => {
    const taskManager = createTaskManager(mockConfig);
    const result = taskManager.setupStudentTasks(student, {
      subfolderIds: { docs: 'mock-folder-id' }
    });

    // Debug output
    console.log('\nTest results for', student.name);
    console.log('Success:', result.success);
    console.log('Results:', result.results);
    console.log('Processed Files:', result.processedFiles);
    console.log('Mock Files:', Array.from(mockFiles.keys()));

    // Verify file names in results
    if (result.success) {
      const expectedName = `${student.Company_ID}+${student.Student_ID}+${mockConfig.COPY_FILE.name}`;
      const fileCreated = mockFiles.has(expectedName);
      const resultMessages = result.results.filter(msg =>
        (msg.includes('Created and shared') || msg.includes('already exists')) &&
        msg.includes(expectedName)
      );

      if (fileCreated && resultMessages.length > 0) {
        results.push(`✓ Correct file name format for ${student.name}: ${expectedName}`);
      } else {
        if (!fileCreated) {
          errors.push(`✗ File not created with expected name for ${student.name}. Expected: ${expectedName}`);
        }
        if (resultMessages.length === 0) {
          errors.push(`✗ File creation message not found for ${student.name}. Expected message containing: ${expectedName}`);
        }
      }
    } else {
      errors.push(`✗ Failed to process student ${student.name}: ${result.errors.join(', ')}`);
    }
  });

  // Test 2: Invalid Company ID format
  console.log('\nTest 2: Company ID format validation');
  const invalidCompanyId = {
    ...testData[0],
    Company_ID: 'ABC01'  // Invalid format
  };

  const taskManager = createTaskManager(mockConfig);
  const result = taskManager.setupStudentTasks(invalidCompanyId, {
    subfolderIds: { docs: 'mock-folder-id' }
  });

  if (!result.success && result.errors.some(err => err.includes('Invalid Company ID format'))) {
    results.push('✓ Invalid Company ID format detected');
  } else {
    errors.push('✗ Failed to detect invalid Company ID format');
  }

  // Test 3: Invalid Student ID format
  console.log('\nTest 3: Student ID format validation');
  const invalidStudentId = {
    ...testData[0],
    Student_ID: '1'  // Invalid format - should be 4 digits
  };

  const result2 = taskManager.setupStudentTasks(invalidStudentId, {
    subfolderIds: { docs: 'mock-folder-id' }
  });

  if (!result2.success && result2.errors.some(err => err.includes('Invalid Student ID format'))) {
    results.push('✓ Invalid Student ID format detected');
  } else {
    errors.push('✗ Failed to detect invalid Student ID format');
  }

  // Display results
  console.log('\nTest Results:');
  results.forEach(r => console.log(r));

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(e));
    return false;
  }

  console.log('\nAll tests passed successfully!');
  return true;
}

// Run tests
const testsPassed = runTests();
console.log(`\nOverall test result: ${testsPassed ? 'PASSED' : 'FAILED'}`);
