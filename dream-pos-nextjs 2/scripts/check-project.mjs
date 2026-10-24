import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'app/page.tsx', 'app/layout.tsx', 'app/globals.css', 'components/pos-app.tsx',
  'lib/server/auth.ts', 'lib/server/db.ts', 'db/schema.sql', '.env.example',
  'app/api/auth/login/route.ts', 'app/api/sales/route.ts', 'app/api/products/route.ts',
  'app/api/health/route.ts',
];
const missing = required.filter((p) => !existsSync(p));
if (missing.length) {
  console.error('Missing required project files:', missing.join(', '));
  process.exitCode = 1;
} else {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const routeDirs = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === 'route.ts') routeDirs.push(full);
    }
  }
  walk('app/api');
  console.log(`Project structure OK: ${routeDirs.length} API route handlers; package ${pkg.name}@${pkg.version}.`);
  console.log('This is a structure check only; run npm install and npm run build to verify compilation.');
}
