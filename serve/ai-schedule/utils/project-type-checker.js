const config = require('../config');

const NO_CONFLICT_PROJECTS = config.schedule.projectTypes.noConflictCheck;
const WITH_CONFLICT_PROJECTS = config.schedule.projectTypes.withConflictCheck;

function needsConflictCheck(projectType) {
  if (!projectType) return false;
  return WITH_CONFLICT_PROJECTS.includes(projectType);
}

function isNoConflictProject(projectType) {
  if (!projectType) return false;
  return NO_CONFLICT_PROJECTS.includes(projectType);
}

function isValidProjectType(projectType) {
  return NO_CONFLICT_PROJECTS.includes(projectType) || 
         WITH_CONFLICT_PROJECTS.includes(projectType);
}

module.exports = {
  needsConflictCheck,
  isNoConflictProject,
  isValidProjectType
};
