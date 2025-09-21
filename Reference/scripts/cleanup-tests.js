#!/usr/bin/env node
/*
  Cleanup Tests Utility
  - Dry-run by default
  - Finds test/debug HTML/JS and Python servers
  - Optionally quarantines files and removes obvious references

  Usage:
    node scripts/cleanup-tests.js --dry-run   # default
    node scripts/cleanup-tests.js --apply
    node scripts/cleanup-tests.js --list      # list-only
*/

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const isApply = args.has('--apply');
const isList = args.has('--list');

const quarantineBase = path.join(projectRoot, 'backups', 'test-quarantine');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const quarantineDir = path.join(quarantineBase, timestamp);

const fileNamePatterns = [
  /^test-.*\.(html|js)$/i,
  /^debug-.*\.(html|js)$/i,
  /^(platform-analysis-server|https_server)\.py$/i,
  /^debug-.*\.(py)$/i
];

const referenceRegexes = [
  /<script[^>]+src=["'][^"']*test-[^"']*["'][^>]*><\/script>/ig,
  /<script[^>]+src=["'][^"']*debug-[^"']*["'][^>]*><\/script>/ig,
  /href=["'][^"']*test-[^"']*["']/ig,
  /href=["'][^"']*debug-[^"']*["']/ig,
  /runDashboardTests\s*\(/g,
  /testMainDashboard(Login|Auth)\s*\(/g,
  /(platform-analysis-server|https_server)\.py/gi
];

const textFileExts = new Set(['.html', '.htm', '.js', '.json', '.md', '.txt', '.css']);

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
    } else {
      results.push(full);
    }
  }
  return results;
}

function matchesAnyPattern(file) {
  const base = path.basename(file);
  return fileNamePatterns.some((re) => re.test(base));
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function removeReferences(content) {
  let modified = content;
  for (const re of referenceRegexes) {
    modified = modified.replace(re, '');
  }
  // Collapse leftover blank lines from removals
  modified = modified.replace(/\n{3,}/g, '\n\n');
  return modified;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function quarantine(file) {
  ensureDir(quarantineDir);
  const rel = path.relative(projectRoot, file);
  const dest = path.join(quarantineDir, rel.replace(/[\\/:]/g, '__'));
  ensureDir(path.dirname(dest));
  fs.renameSync(file, dest);
  return dest;
}

function main() {
  const all = walk(projectRoot);
  const candidates = all.filter(matchesAnyPattern);

  const referenceMatches = [];
  for (const file of all) {
    const ext = path.extname(file).toLowerCase();
    if (!textFileExts.has(ext)) continue;
    const content = readText(file);
    if (!content) continue;
    for (const re of referenceRegexes) {
      if (re.test(content)) {
        referenceMatches.push(file);
        break;
      }
    }
  }

  // Deduplicate lists
  const uniqueCandidates = Array.from(new Set(candidates));
  const uniqueRefs = Array.from(new Set(referenceMatches));

  // Output summary
  console.log('Cleanup Tests Utility');
  console.log('Mode:', isApply ? 'APPLY' : (isList ? 'LIST' : 'DRY-RUN'));
  console.log('Project:', projectRoot);
  console.log('\nFiles detected for quarantine:', uniqueCandidates.length);
  uniqueCandidates.forEach(f => console.log('  -', path.relative(projectRoot, f)));
  console.log('\nFiles containing test/debug references:', uniqueRefs.length);
  uniqueRefs.forEach(f => console.log('  -', path.relative(projectRoot, f)));

  if (isList) return;

  if (!isApply) {
    console.log('\nDRY-RUN complete. No files modified.');
    console.log('To apply changes, run: npm run cleanup-tests:apply');
    return;
  }

  // Apply mode
  // 1) Quarantine candidate files
  if (uniqueCandidates.length > 0) {
    ensureDir(quarantineDir);
    for (const file of uniqueCandidates) {
      try {
        const dest = quarantine(file);
        console.log('Quarantined:', path.relative(projectRoot, file), '->', path.relative(projectRoot, dest));
      } catch (e) {
        console.warn('Failed to quarantine', file, e.message);
      }
    }
  }

  // 2) Remove obvious references from text files
  for (const file of uniqueRefs) {
    try {
      const content = readText(file);
      if (!content) continue;
      const cleaned = removeReferences(content);
      if (cleaned !== content) {
        fs.writeFileSync(file, cleaned, 'utf8');
        console.log('Cleaned references in:', path.relative(projectRoot, file));
      }
    } catch (e) {
      console.warn('Failed to clean', file, e.message);
    }
  }

  console.log('\nAPPLY complete. Quarantine folder:', path.relative(projectRoot, quarantineDir));
}

main();


