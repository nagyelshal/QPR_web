#!/usr/bin/env node
/*
  Archive content files instead of deleting them.
  Usage:
    node scripts/archive-content.cjs <src-path...> [--reason "text"]
  Example:
    node scripts/archive-content.cjs src/content/news/2025-08-26-kits-pickup-and-practice.md --reason "Superseded by new guidance"
*/

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = [...argv];
  const reasonIndex = args.indexOf('--reason');
  let reason = '';
  if (reasonIndex !== -1) {
    reason = args[reasonIndex + 1] || '';
    args.splice(reasonIndex, 2);
  }
  return { files: args, reason };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function addArchiveFrontmatter(content, extra) {
  const hasFM = content.startsWith('---\n');
  if (hasFM) {
    const end = content.indexOf('\n---', 4);
    if (end !== -1) {
      const fm = content.slice(0, end + 4);
      const body = content.slice(end + 4);
      const injected = Object.entries(extra)
        .map(([k, v]) => `${k}: ${String(v).replace(/\n/g, ' ')}`)
        .join('\n');
      return fm.replace('\n---', `\n${injected}\n---`) + body;
    }
  }
  const injected = Object.entries(extra)
    .map(([k, v]) => `${k}: ${String(v).replace(/\n/g, ' ')}`)
    .join('\n');
  return `---\n${injected}\n---\n\n` + content;
}

function slugify(name) {
  return name
    .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function archiveOne(srcPath, reason) {
  const repoRoot = process.cwd();
  let absSrc = path.isAbsolute(srcPath) ? srcPath : path.join(repoRoot, srcPath);
  if (!fs.existsSync(absSrc)) throw new Error(`Source not found: ${srcPath}`);
  const relFromContent = path.relative(path.join(repoRoot, 'src', 'content'), absSrc);
  if (relFromContent.startsWith('..')) throw new Error('Only files under src/content can be archived.');

  const original_collection = relFromContent.split(path.sep)[0];
  const original_path = relFromContent;
  const content = fs.readFileSync(absSrc, 'utf8');

  const baseName = path.basename(absSrc, path.extname(absSrc));
  const datePrefix = new Date().toISOString().slice(0, 10);
  const slug = `${datePrefix}-${slugify(baseName)}`;

  const archiveDir = path.join(repoRoot, 'src', 'content', 'archive');
  ensureDir(archiveDir);
  let destPath = path.join(archiveDir, `${slug}.md`);
  let idx = 1;
  while (fs.existsSync(destPath)) {
    destPath = path.join(archiveDir, `${slug}-${idx++}.md`);
  }

  const archived_at = nowIso();
  const augmented = addArchiveFrontmatter(content, {
    archived: true,
    archived_at,
    original_collection,
    original_path,
    archive_reason: reason || ''
  });

  fs.writeFileSync(destPath, augmented, 'utf8');
  fs.unlinkSync(absSrc); // remove from original location to hide from listings
  return { srcPath, destPath };
}

(function main() {
  const { files, reason } = parseArgs(process.argv.slice(2));
  if (files.length === 0) {
    console.error('Usage: node scripts/archive-content.cjs <src-path...> [--reason "text"]');
    process.exit(1);
  }
  const results = [];
  for (const f of files) {
    try {
      results.push(archiveOne(f, reason));
    } catch (e) {
      console.error(`Failed to archive ${f}:`, e.message);
      process.exitCode = 1;
    }
  }
  if (results.length) {
    console.log('Archived:');
    for (const r of results) console.log(` - ${r.srcPath} -> ${r.destPath}`);
  }
})();
