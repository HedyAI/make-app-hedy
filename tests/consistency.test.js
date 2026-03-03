// Tests: interface ↔ sample consistency across all modules
// Catches field name mismatches without needing live API calls

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.resolve(__dirname, '../modules');

/** Resolve a dotted field path (e.g. "data.sessionId") in an object */
function resolvePath(obj, fieldName) {
  const parts = fieldName.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/** Load and parse a JSON file, or return null if it doesn't exist */
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Get all module directories that have both interface and samples files */
function getModulesWithBothFiles() {
  const modules = [];
  for (const dir of fs.readdirSync(MODULES_DIR)) {
    const modulePath = path.join(MODULES_DIR, dir);
    if (!fs.statSync(modulePath).isDirectory()) continue;

    const interfacePath = path.join(modulePath, `${dir}.interface.iml.json`);
    const samplesPath = path.join(modulePath, `${dir}.samples.iml.json`);

    const iface = loadJson(interfacePath);
    const samples = loadJson(samplesPath);

    if (iface && samples) {
      modules.push({ name: dir, iface, samples });
    }
  }
  return modules;
}

describe('Interface ↔ Sample consistency', () => {
  const modules = getModulesWithBothFiles();

  // Skip makeAnApiCall — its samples are generic (statusCode/headers/body)
  const testableModules = modules.filter((m) => m.name !== 'makeAnApiCall');

  test.each(testableModules.map((m) => [m.name, m]))(
    '%s: every interface field exists in sample data',
    (name, { iface, samples }) => {
      const missing = [];

      function checkFields(fields, data, prefix) {
        for (const field of fields) {
          const value = resolvePath(data, field.name);
          const fullPath = prefix ? `${prefix}.${field.name}` : field.name;

          if (value === undefined) {
            missing.push(fullPath);
          }

          // Recurse into array specs if the sample has array data
          if (field.type === 'array' && field.spec?.length > 0 && Array.isArray(value) && value.length > 0) {
            checkFields(field.spec, value[0], `${fullPath}[0]`);
          }
        }
      }

      checkFields(iface, samples, '');

      if (missing.length > 0) {
        throw new Error(
          `${name}: interface fields not found in sample data:\n` +
            missing.map((f) => `  - ${f}`).join('\n')
        );
      }
    }
  );

  test.each(testableModules.map((m) => [m.name, m]))(
    '%s: every top-level sample key has a matching interface field',
    (name, { iface, samples }) => {
      // Collect all interface field names (top-level segment only for dotted paths)
      const interfaceNames = new Set(
        iface.map((f) => f.name.split('.')[0])
      );

      const extra = Object.keys(samples).filter((key) => !interfaceNames.has(key));

      if (extra.length > 0) {
        throw new Error(
          `${name}: sample keys not covered by interface:\n` +
            extra.map((f) => `  - ${f}`).join('\n')
        );
      }
    }
  );
});
