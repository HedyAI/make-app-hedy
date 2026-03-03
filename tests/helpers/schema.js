const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.resolve(__dirname, '../../modules');

const TYPE_VALIDATORS = {
  text: (v) => typeof v === 'string' || v === null,
  number: (v) => typeof v === 'number' || v === null,
  date: (v) => typeof v === 'string' || v === null,
  boolean: (v) => typeof v === 'boolean',
  array: (v) => Array.isArray(v) || v === null,
};

function loadInterface(moduleName) {
  const filePath = path.join(MODULES_DIR, moduleName, `${moduleName}.interface.iml.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Validates a data object against a Make interface spec.
 * Returns an array of { field, issue, severity } objects.
 */
function validateAgainstInterface(data, interfaceSpec, prefix = '') {
  const errors = [];

  for (const field of interfaceSpec) {
    const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
    const value = data[field.name];

    if (value === undefined) {
      errors.push({ field: fieldPath, issue: 'missing', severity: 'warning' });
      continue;
    }

    const validator = TYPE_VALIDATORS[field.type];
    if (validator && !validator(value)) {
      errors.push({
        field: fieldPath,
        issue: `expected ${field.type}, got ${typeof value} (${JSON.stringify(value)})`,
        severity: 'error',
      });
    }

    // Recurse into array specs
    if (field.type === 'array' && field.spec && Array.isArray(value)) {
      for (let i = 0; i < Math.min(value.length, 3); i++) {
        errors.push(
          ...validateAgainstInterface(value[i], field.spec, `${fieldPath}[${i}]`)
        );
      }
    }
  }

  return errors;
}

/**
 * Asserts that data matches the interface spec, failing on errors (not warnings).
 */
function expectMatchesInterface(data, moduleName) {
  const spec = loadInterface(moduleName);
  const issues = validateAgainstInterface(data, spec);
  const errors = issues.filter((i) => i.severity === 'error');

  if (errors.length > 0) {
    const msg = errors.map((e) => `  ${e.field}: ${e.issue}`).join('\n');
    throw new Error(`Interface validation failed for ${moduleName}:\n${msg}`);
  }

  return issues;
}

module.exports = { loadInterface, validateAgainstInterface, expectMatchesInterface };
