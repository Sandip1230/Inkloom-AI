// visualize.js — schema for the Visualize stage response
module.exports = {
  typography: 'object',    // { headingFont, bodyFont, pairingRationale }
  colorPalette: 'object[]', // [{ name, hex, role }]
  imageryStyle: 'string',
  conceptsToAvoid: 'string[]',
  mark: 'object',           // { shape, style, monogramLetter, rationale }
};