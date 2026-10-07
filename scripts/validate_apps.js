const path = require('path');
const yaml = require('yaml');
const fs = require('fs-extra');

const PUBLIC_FOLDER = path.join(__dirname, '..', 'public');
const VERSION_FOLDER = path.join(PUBLIC_FOLDER, 'v4');
const APPS_FOLDER = path.join(VERSION_FOLDER, 'apps');
const LOGOS_FOLDER = path.join(VERSION_FOLDER, 'logos');

const BUILT_IN_VARIABLES = new Set([
  '$$cap_appname',
  '$$cap_root_domain',
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectStrings(value, output = []) {
  if (typeof value === 'string') {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, output);
    }
    return output;
  }

  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      output.push(key);
      collectStrings(item, output);
    }
  }

  return output;
}

function tokenBase(token) {
  const paren = token.indexOf('(');
  return paren === -1 ? token : token.slice(0, paren);
}

function isBuiltInToken(token) {
  return (
    BUILT_IN_VARIABLES.has(token) ||
    /^\$\$cap_gen_random_hex\([1-9][0-9]*\)$/.test(token)
  );
}

function validateVariables(appName, content, source) {
  assert(!/\$\$\$cap_/.test(source), 'Found $$$cap_ token in ' + appName);
  assert(
    !/(^|[^$])\$cap_/.test(source),
    'Found single-dollar $cap_ token in ' + appName
  );

  const variables = content.caproverOneClickApp.variables || [];
  assert(Array.isArray(variables), 'variables must be an array in ' + appName);

  const declared = new Set();

  for (const variable of variables) {
    assert(
      variable && typeof variable === 'object',
      'Invalid variable entry in ' + appName
    );
    assert(
      typeof variable.id === 'string' && /^\$\$cap_[A-Za-z0-9_]+$/.test(variable.id),
      'Invalid variable id in ' + appName
    );
    assert(
      typeof variable.label === 'string' && variable.label.trim(),
      'Missing variable label for ' + variable.id + ' in ' + appName
    );
    assert(
      !declared.has(variable.id),
      'Duplicate variable id ' + variable.id + ' in ' + appName
    );
    declared.add(variable.id);
  }

  const strings = collectStrings(content);
  const tokens = new Set();

  for (const value of strings) {
    const matches = value.match(/\$\$cap_[A-Za-z0-9_]+(?:\([^)\n]*\))?/g) || [];
    for (const token of matches) {
      tokens.add(token);
    }
  }

  for (const token of tokens) {
    if (isBuiltInToken(token)) {
      continue;
    }

    const base = tokenBase(token);
    assert(
      declared.has(base),
      'Undeclared CapRover variable ' + token + ' in ' + appName
    );
  }
}

async function validateAppFile(appFile) {
  const filePath = path.join(APPS_FOLDER, appFile);
  const source = await fs.readFile(filePath, 'utf-8');

  let content;
  try {
    content = yaml.parse(source);
  } catch (error) {
    throw new Error('Invalid YAML in ' + appFile + ': ' + error.message);
  }

  assert(
    content && typeof content === 'object',
    'YAML root must be an object in ' + appFile
  );
  assert(content.captainVersion === 4, 'captainVersion must be 4 in ' + appFile);
  assert(
    content.services &&
      typeof content.services === 'object' &&
      Object.keys(content.services).length > 0,
    'Missing services in ' + appFile
  );

  const app = content.caproverOneClickApp;
  assert(app && typeof app === 'object', 'Missing caproverOneClickApp in ' + appFile);
  assert(
    typeof app.displayName === 'string' && app.displayName.trim(),
    'Missing displayName in ' + appFile
  );
  assert(
    typeof app.description === 'string' && app.description.trim(),
    'Missing description in ' + appFile
  );
  assert(
    app.description.length <= 200,
    'Description too long in ' + appFile + ' (max 200 characters)'
  );
  assert(
    app.instructions &&
      typeof app.instructions.start === 'string' &&
      app.instructions.start.trim() &&
      typeof app.instructions.end === 'string' &&
      app.instructions.end.trim(),
    'Missing instructions.start or instructions.end in ' + appFile
  );
  assert(
    (typeof app.documentation === 'string' && app.documentation.trim()) ||
      (typeof app.baseUrl === 'string' && app.baseUrl.trim()),
    'Add documentation or baseUrl in ' + appFile
  );

  validateVariables(appFile, content, source);
}

async function validateCatalog() {
  const appFiles = (await fs.readdir(APPS_FOLDER)).sort();
  const invalidAppFiles = appFiles.filter((file) => !file.endsWith('.yml'));
  assert(
    invalidAppFiles.length === 0,
    'Only .yml files are allowed in public/v4/apps: ' + invalidAppFiles.join(', ')
  );

  const appNames = appFiles.map((file) => file.slice(0, -4));

  const logoFiles = (await fs.readdir(LOGOS_FOLDER)).sort();
  const invalidLogoFiles = logoFiles.filter((file) => !file.endsWith('.png'));
  assert(
    invalidLogoFiles.length === 0,
    'Only PNG logos are allowed in public/v4/logos: ' + invalidLogoFiles.join(', ')
  );

  const logoNames = new Set(logoFiles.map((file) => file.slice(0, -4)));
  const appNameSet = new Set(appNames);

  const missingLogos = appNames.filter((name) => !logoNames.has(name));
  const extraLogos = [...logoNames].filter((name) => !appNameSet.has(name));

  assert(missingLogos.length === 0, 'Missing PNG logos: ' + missingLogos.join(', '));
  assert(extraLogos.length === 0, 'Orphan PNG logos: ' + extraLogos.join(', '));

  for (const appFile of appFiles) {
    await validateAppFile(appFile);
    console.log('App ' + appFile + ' looking good!');
  }

  console.log(
    'Validated ' + appFiles.length + ' apps and ' + logoFiles.length + ' PNG logos.'
  );
}

validateCatalog().catch((error) => {
  console.error(error);
  process.exit(127);
});
