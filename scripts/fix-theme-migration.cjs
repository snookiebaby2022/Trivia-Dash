/**
 * Fix broken theme migration (hooks inserted into parameter lists).
 * Run: node scripts/fix-theme-migration.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', 'src');
const HOOK_BLOCK =
  '\n  const { colors } = useTheme();\n  const styles = useMemo(() => makeStyles(colors), [colors]);\n';

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (/\.tsx$/.test(ent.name)) out.push(p);
  }
  return out;
}

function fix(file) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (src.includes('useMemo from')) {
    src = src.replace(/useMemo from/g, 'useMemo } from');
    changed = true;
  }
  if (src.includes('{ useMemo, {')) {
    src = src.replace(/\{ useMemo, \{ /g, '{ useMemo, ');
    changed = true;
  }
  if (!src.includes('useTheme')) return changed;

  if (!src.includes("from '../context/ThemeContext'")) {
    const reactLine = src.match(/^import React[^\n]*\n/m);
    if (reactLine && !src.includes('ThemeContext')) {
      src = src.replace(reactLine[0], `${reactLine[0]}import { useTheme } from '../context/ThemeContext';\n`);
      changed = true;
    }
  }

  // Move hook block from inside `export function Name({` to after `}: Props) {`
  const broken = /export function (\w+)\(\{\s*const \{ colors \} = useTheme\(\);\s*const styles = useMemo\(\(\) => makeStyles\(colors\), \[colors\]\);\s*/;
  if (broken.test(src)) {
    src = src.replace(broken, 'export function $1({');
    // Insert hook after closing of props `}: ... ) {`
    src = src.replace(
      /(\}: Props\) \{)/,
      `$1${HOOK_BLOCK}`
    );
  }

  // ResultScreen-style: `export function ResultScreen({\n  const { colors }... navigation, route }: Props)`
  const broken2 =
    /export function (\w+)\(\{\s*const \{ colors \} = useTheme\(\);\s*const styles = useMemo\(\(\) => makeStyles\(colors\), \[colors\]\);\s*([\s\S]*?\}: Props\) \{)/;
  if (broken2.test(src)) {
    src = src.replace(broken2, 'export function $1({ $2');
    if (!src.includes('const { colors } = useTheme()')) {
      src = src.replace(/(\}: Props\) \{)/, `$1${HOOK_BLOCK}`);
    }
    changed = true;
  }

  // Generic: hook before first prop in destructuring
  const broken3 =
    /export function (\w+)\(\{\s*const \{ colors \} = useTheme\(\);\s*const styles = useMemo\(\(\) => makeStyles\(colors\), \[colors\]\);\s*\n\n/;
  if (broken3.test(src)) {
    src = src.replace(broken3, 'export function $1({\n');
    src = src.replace(/(\}: Props\) \{)/, `$1${HOOK_BLOCK}`);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, src);
  return changed;
}

let n = 0;
for (const f of walk(ROOT)) {
  if (fix(f)) {
    console.log('fixed', path.relative(ROOT, f));
    n++;
  }
}
console.log(`Fixed ${n} files.`);
