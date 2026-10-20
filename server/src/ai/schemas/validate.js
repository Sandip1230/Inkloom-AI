// validate.js
// Minimal, dependency-free schema checker. Each stage schema is a plain
// object mapping field name -> expected type ('string' | 'string[]' |
// 'boolean' | 'number' | 'object' | 'object[]'). No external library needed for this small a shape.

function validateAgainstSchema(stageName, schema, data) {
  const errors = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return [`Expected a JSON object for stage "${stageName}", got ${Array.isArray(data) ? 'an array' : typeof data}.`];
  }

  for (const [field, type] of Object.entries(schema)) {
    const value = data[field];

    if (value === undefined || value === null) {
      errors.push(`Missing required field "${field}".`);
      continue;
    }

    if (type === 'string' && typeof value !== 'string') {
      errors.push(`Field "${field}" must be a string.`);
    } else if (type === 'number' && typeof value !== 'number') {
      errors.push(`Field "${field}" must be a number.`);
    } else if (type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Field "${field}" must be a boolean.`);
    } else if (type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      errors.push(`Field "${field}" must be an object.`);
    } else if (type === 'string[]') {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
        errors.push(`Field "${field}" must be an array of strings.`);
      }
    } else if (type === 'object[]') {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))) {
        errors.push(`Field "${field}" must be an array of objects.`);
      }
    }
  }

  return errors;
}

module.exports = { validateAgainstSchema };