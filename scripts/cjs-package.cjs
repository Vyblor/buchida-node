// The root package.json has "type": "module", so Node would load dist/cjs/*.js as ESM.
// This marker makes that folder CommonJS again for require("buchida").
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

writeFileSync(join(__dirname, "..", "dist", "cjs", "package.json"), '{ "type": "commonjs" }\n');
