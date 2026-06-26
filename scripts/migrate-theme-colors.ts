/**
 * Mechanical theme migration for files that use static `colors` from theme.
 * Run: npx tsx scripts/migrate-theme-colors.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'src');

const SKIP = new Set([
  'theme.ts',
  'HomeScreen.tsx',
  'SettingsScreen.tsx',
  'GameScreen.tsx',
  'AuthPanel.tsx',
  'OnboardingWalkthrough.tsx',
  'ThemeContext.tsx',
  'PrimaryButton.tsx',
  'LegalLinks.tsx',
  'resultCopy.ts',
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function migrate(file: string): boolean {
  const base = path.basename(file);
  if (SKIP.has(base)) return false;

  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes("from '../theme'") && !src.includes('from "../theme"')) return false;
  if (!/import\s*\{[^}]*\bcolors\b/.test(src)) return false;

  // Already migrated
  if (src.includes('useTheme') && src.includes('makeStyles')) return false;

  src = src.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/theme['"];/,
    (_m, inner: string) => {
      const parts = inner.split(',').map((s) => s.trim()).filter(Boolean);
      const rest = parts.filter((p) => p !== 'colors');
      return `import type { ThemeColors } from '../theme';\nimport { ${rest.join(', ')} } from '../theme';`;
    }
  );

  if (!src.includes("from '../context/ThemeContext'")) {
    const reactImport = src.match(/^import React[^\n]*\n/m);
    if (reactImport) {
      const line = reactImport[0];
      if (!line.includes('useMemo')) {
        src = src.replace(line, line.replace('import React', 'import React, { useMemo'));
      }
      src = src.replace(
        reactImport[0],
        `${reactImport[0]}import { useTheme } from '../context/ThemeContext';\n`
      );
    } else {
      src = `import { useMemo } from 'react';\nimport { useTheme } from '../context/ThemeContext';\n${src}`;
    }
  }

  const fnMatch = src.match(/export function (\w+)/);
  const componentName = fnMatch?.[1];
  if (!componentName) return false;

  const fnStart = src.indexOf(`export function ${componentName}`);
  const brace = src.indexOf('{', fnStart);
  const hook = '\n  const { colors } = useTheme();\n  const styles = useMemo(() => makeStyles(colors), [colors]);\n';
  if (!src.slice(fnStart, fnStart + 400).includes('useTheme()')) {
    src = src.slice(0, brace + 1) + hook + src.slice(brace + 1);
  }

  src = src.replace(
    /const styles = StyleSheet\.create\(\{/,
    'function makeStyles(colors: ThemeColors) {\n  return StyleSheet.create({'
  );
  src = src.replace(/\}\);\s*$/, '  });\n}\n');

  fs.writeFileSync(file, src);
  return true;
}

const files = walk(ROOT);
let n = 0;
for (const f of files) {
  if (migrate(f)) {
    console.log('migrated', path.relative(ROOT, f));
    n++;
  }
}
console.log(`Done. ${n} files updated.`);
