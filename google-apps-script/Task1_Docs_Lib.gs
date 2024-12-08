/**
 * Required OAuth Scopes:
 * https://www.googleapis.com/auth/documents.currentonly
 */

const TASK_CONFIG = {
  TOTAL_REQUIRED: 3,  // Total number of "Aarohan" instances that need to be bold
  SEARCH_TERM: 'Aarohan'
};

/**
 * Checks if all instances of "Aarohan" are bold in the document
 * @param {Body} body - Document body to check
 * @param {Array} results - Array to store completed tasks
 * @param {Array} errors - Array to store incomplete tasks
 */
function checkAarohanFormatting(body, results, errors) {
  const searchResult = body.findText(TASK_CONFIG.SEARCH_TERM);
  let count = 0;
  let foundCount = 0;
  let foundInstances = [];

  // First pass: collect all instances
  while (searchResult) {
    foundCount++;
    const element = searchResult.getElement();
    const startOffset = searchResult.getStartOffset();
    const endOffset = searchResult.getEndOffset();

    foundInstances.push({
      element: element,
      position: foundCount,
      isBold: element.isBold(),
      text: element.getText().substring(startOffset, endOffset),
      location: `Paragraph ${body.getChildIndex(element.getParent()) + 1}`
    });

    searchResult = body.findText(TASK_CONFIG.SEARCH_TERM, searchResult);
  }

  // Second pass: analyze and report results
  foundInstances.forEach(instance => {
    if (instance.isBold) {
      count++;
      results.push(
        `✅ Instance ${instance.position} of "${instance.text}" at ${instance.location} is correctly formatted as bold`
      );
    } else {
      errors.push(
        `❌ Instance ${instance.position} of "${instance.text}" at ${instance.location} needs to be bold\n` +
        `❌ Current formatting: Not bold\n` +
        `❌ Required formatting: Bold\n` +
        `❌ How to fix: Select the text and press Ctrl/Cmd + B or use the bold button in the toolbar`
      );
    }
  });

  // Report count mismatches with detailed explanation
  if (foundCount < TASK_CONFIG.TOTAL_REQUIRED) {
    errors.push(
      `❌ Missing instances of "${TASK_CONFIG.SEARCH_TERM}":\n` +
      `❌ Current count: ${foundCount}\n` +
      `❌ Required count: ${TASK_CONFIG.TOTAL_REQUIRED}\n` +
      `❌ Missing count: ${TASK_CONFIG.TOTAL_REQUIRED - foundCount}\n` +
      `❌ How to fix: Add ${TASK_CONFIG.TOTAL_REQUIRED - foundCount} more instance(s) of "${TASK_CONFIG.SEARCH_TERM}" to the document`
    );
  } else if (foundCount > TASK_CONFIG.TOTAL_REQUIRED) {
    errors.push(
      `❌ Too many instances of "${TASK_CONFIG.SEARCH_TERM}":\n` +
      `❌ Current count: ${foundCount}\n` +
      `❌ Required count: ${TASK_CONFIG.TOTAL_REQUIRED}\n` +
      `❌ Excess count: ${foundCount - TASK_CONFIG.TOTAL_REQUIRED}\n` +
      `❌ How to fix: Remove ${foundCount - TASK_CONFIG.TOTAL_REQUIRED} instance(s) of "${TASK_CONFIG.SEARCH_TERM}" from the document`
    );
  }
}

/**
 * Checks the assignment formatting and handles results
 * @param {Document} doc - Google Doc to check
 * @param {Object} currentAssignmentData - Current assignment data
 * @param {Array} nextAssignmentData - Next assignment data if available
 */
function checkAssignment(doc, currentAssignmentData, nextAssignmentData) {
  const body = doc.getBody();
  const results = [];
  const errors = [];

  checkAarohanFormatting(body, results, errors);

  const score = results.length;
  const percentage = (score / TASK_CONFIG.TOTAL_REQUIRED) * 100;

  // If passed required percentage, handle next assignment sharing
  if (currentAssignmentData && percentage >= currentAssignmentData.requiredPercentage && nextAssignmentData) {
    CommonLib.getPublicMethods().handleNextAssignment(doc, nextAssignmentData);
  }

  // Display results
  CommonLib.getPublicMethods().displayResults(results, errors, score, percentage, nextAssignmentData);
}

/**
 * Public methods exposed by the library
 */
function getPublicMethods() {
  return {
    runCheck: checkAssignment,
    showPermissionGuideLink: CommonLib.getPublicMethods().showPermissionGuideLink,
    showPermissionsInfo: CommonLib.getPublicMethods().showPermissionsInfo
  };
}
