/**
 * Required OAuth Scopes:
 * @OnlyCurrentDoc
 * @NotOnlyCurrentDoc
 * https://www.googleapis.com/auth/documents.currentonly
 * https://www.googleapis.com/auth/drive
 * https://www.googleapis.com/auth/spreadsheets
 */

function onOpen() {
  CommonLib.getPublicMethods().createUI();
}

function runCheckFromDoc() {
  const doc = DocumentApp.getActiveDocument();
  try {
    const currentAssignmentData = CommonLib.getPublicMethods().getCurrentAssignment(doc.getName());
    const nextAssignmentData = CommonLib.getPublicMethods().getNextAssignment(currentAssignmentData?.assignmentNumber);

    Task1_Docs_Lib.getPublicMethods().runCheck(doc, currentAssignmentData, nextAssignmentData);
  } catch(e) {
    CommonLib.getPublicMethods().displayError('Could not access assignment data. Please try again.');
  }
}

function showPermissionsInfo() {
  CommonLib.getPublicMethods().showPermissionsInfo();
}

function showPermissionGuideLink() {
  CommonLib.getPublicMethods().showPermissionGuideLink();
}
