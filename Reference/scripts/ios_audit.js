#!/usr/bin/env node
// Non-destructive iOS project audit: scans files, never modifies
// Outputs a concise Markdown + JSON summary to stdout

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IOS_DIR = path.join(ROOT, 'MobileApp/CF-Job-Listings/CF-Job-Listings');
const XCODEPROJ = path.join(ROOT, 'MobileApp/CF-Job-Listings/CF-Job-Listings.xcodeproj');

function listFiles(dir, exts) {
  const out = [];
  (function walk(d){
    if (!fs.existsSync(d)) return;
    const items = fs.readdirSync(d, { withFileTypes: true });
    for (const it of items) {
      const p = path.join(d, it.name);
      if (it.isDirectory()) walk(p);
      else if (!exts || exts.some(e => p.toLowerCase().endsWith(e))) out.push(p);
    }
  })(dir);
  return out;
}

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function grepCount(content, patterns) {
  const o = {};
  for (const label in patterns) {
    const re = patterns[label];
    o[label] = (content.match(re) || []).length;
  }
  return o;
}

function detectSPMProducts() {
  // Try to parse project.pbxproj for Firebase products
  const pbx = read(path.join(XCODEPROJ, 'project.pbxproj'));
  const products = ['FirebaseCore', 'FirebaseAuth', 'FirebaseFirestore', 'FirebaseStorage'];
  const present = {};
  products.forEach(p => present[p] = pbx.includes(p));
  return present;
}

function scanSwiftUsage(files) {
  const summary = {
    imports: { FirebaseCore: 0, FirebaseAuth: 0, FirebaseFirestore: 0, FirebaseStorage: 0, PhotosUI: 0, Charts: 0 },
    symbols: {
      Storage_upload: 0,
      Firestore_queries: 0,
      Auth_signin: 0,
      PhotosPicker: 0
    },
    views: {},
  };
  for (const f of files) {
    const c = read(f);
    const counts = grepCount(c, {
      FirebaseCore: /import\s+FirebaseCore/g,
      FirebaseAuth: /import\s+FirebaseAuth/g,
      FirebaseFirestore: /import\s+FirebaseFirestore/g,
      FirebaseStorage: /import\s+FirebaseStorage/g,
      PhotosUI: /import\s+PhotosUI/g,
      Charts: /import\s+Charts/g,
      Storage_upload: /Storage\.storage\(|putData\s*\(|putDataAsync\s*\(/g,
      Firestore_queries: /Firestore\.firestore\(\)|collection\(|whereField\(|getDocuments\(|addSnapshotListener\(/g,
      Auth_signin: /Auth\.|signIn\(|createUser\(|currentUser/g,
      PhotosPicker: /PhotosPicker\(/g,
    });
    summary.imports.FirebaseCore += counts.FirebaseCore;
    summary.imports.FirebaseAuth += counts.FirebaseAuth;
    summary.imports.FirebaseFirestore += counts.FirebaseFirestore;
    summary.imports.FirebaseStorage += counts.FirebaseStorage;
    summary.imports.PhotosUI += counts.PhotosUI;
    summary.imports.Charts += counts.Charts;
    summary.symbols.Storage_upload += counts.Storage_upload;
    summary.symbols.Firestore_queries += counts.Firestore_queries;
    summary.symbols.Auth_signin += counts.Auth_signin;
    summary.symbols.PhotosPicker += counts.PhotosPicker;
    // naive view detection
    if (f.endsWith('.swift') && /struct\s+\w+View\s*:\s*View/.test(c)) {
      const m = c.match(/struct\s+(\w+)View\s*:\s*View/);
      if (m) summary.views[m[1]] = f.replace(ROOT + '/', '');
    }
  }
  return summary;
}

function checkPlist() {
  const plist = listFiles(IOS_DIR, ['.plist']).find(p => p.endsWith('Info.plist')) || '';
  const xml = read(plist);
  return {
    path: plist.replace(ROOT + '/', ''),
    photoUsage: /NSPhotoLibraryUsageDescription/.test(xml),
    cameraUsage: /NSCameraUsageDescription/.test(xml),
    micUsage: /NSMicrophoneUsageDescription/.test(xml),
  };
}

function main() {
  const swiftFiles = listFiles(IOS_DIR, ['.swift']);
  const spm = detectSPMProducts();
  const swiftSummary = scanSwiftUsage(swiftFiles);
  const plist = checkPlist();

  const featureChecklist = [
    { key: 'avatars', ok: swiftSummary.symbols.PhotosPicker > 0 && spm.FirebaseStorage },
    { key: 'messaging', ok: swiftSummary.symbols.Firestore_queries > 0 },
    { key: 'community', ok: Object.keys(swiftSummary.views).some(v => /Community/i.test(v)) },
    { key: 'teamDirectory', ok: Object.keys(swiftSummary.views).some(v => /Team|Directory/i.test(v)) },
    { key: 'performance', ok: swiftSummary.imports.Charts > 0 },
    { key: 'calendar', ok: Object.keys(swiftSummary.views).some(v => /Calendar/i.test(v)) },
    { key: 'adminDashboard', ok: Object.keys(swiftSummary.views).some(v => /Admin/i.test(v)) },
  ];

  const report = {
    project: 'CF-Job-Listings iOS Audit',
    when: new Date().toISOString(),
    spmProducts: spm,
    swiftSummary,
    infoPlist: plist,
    featureChecklist,
    recommendations: []
  };

  // Recommendations
  if (!spm.FirebaseStorage) report.recommendations.push('Link FirebaseStorage package product to the iOS target.');
  if (!plist.photoUsage) report.recommendations.push('Add NSPhotoLibraryUsageDescription to Info.plist for PhotosPicker.');
  if (swiftSummary.symbols.Storage_upload === 0) report.recommendations.push('No Storage uploads detected; ensure avatar/showcase upload paths are implemented.');
  if (swiftSummary.imports.FirebaseCore === 0) report.recommendations.push('FirebaseCore import/config not detected in Swift sources.');

  // Output
  const md = [];
  md.push('### iOS Project Audit (read-only)');
  md.push('');
  md.push(`- Firebase SPM linked: ${Object.entries(spm).map(([k,v])=>`${k}:${v?'✅':'❌'}`).join(', ')}`);
  md.push(`- Info.plist: ${plist.path || '(not found)'} | Photos: ${plist.photoUsage?'✅':'❌'} Camera: ${plist.cameraUsage?'✅':'❌'}`);
  md.push(`- Imports → Core:${swiftSummary.imports.FirebaseCore} Auth:${swiftSummary.imports.FirebaseAuth} FS:${swiftSummary.imports.FirebaseFirestore} Storage:${swiftSummary.imports.FirebaseStorage} PhotosUI:${swiftSummary.imports.PhotosUI} Charts:${swiftSummary.imports.Charts}`);
  md.push(`- Symbols → Storage upload:${swiftSummary.symbols.Storage_upload} Firestore queries:${swiftSummary.symbols.Firestore_queries} PhotosPicker:${swiftSummary.symbols.PhotosPicker}`);
  md.push(`- Views detected: ${Object.keys(swiftSummary.views).length}`);
  md.push('- Feature coverage:');
  featureChecklist.forEach(f => md.push(`  - ${f.key}: ${f.ok ? '✅' : '❌'}`));
  if (report.recommendations.length) {
    md.push(''); md.push('**Recommendations**');
    report.recommendations.forEach(r => md.push(`- ${r}`));
  }

  console.log(md.join('\n'));
  console.log('\n--- JSON ---');
  console.log(JSON.stringify(report, null, 2));
}

main();


