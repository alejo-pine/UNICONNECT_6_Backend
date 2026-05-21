import fs from 'fs';
import path from 'path';
import { swaggerSpec } from '../config/swagger.js';

const docsDir = path.resolve(process.cwd(), 'docs');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Read version from package.json
const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version || '1.0.0';

// Write the primary openapi.json
const openapiPath = path.join(docsDir, 'openapi.json');
fs.writeFileSync(openapiPath, JSON.stringify(swaggerSpec, null, 2));

// Write versioned openapi.json
const versionedPath = path.join(docsDir, `openapi.v${version}.json`);
fs.writeFileSync(versionedPath, JSON.stringify(swaggerSpec, null, 2));

console.log(`✅ OpenAPI specification generated successfully at ${openapiPath}`);
console.log(`✅ Versioned OpenAPI specification generated at ${versionedPath}`);
