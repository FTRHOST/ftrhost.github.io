// prepare-data.js
const fs = require('fs/promises');
const path = require('path');
const simpleGit = require('simple-git');

// --- KONFIGURASI (UBAH BAGIAN INI) ---
const REPO_URL = 'https://github.com/FTRHOST/informasimanu'; // Ganti dengan URL repo target Anda
const REPO_DIR = './temp_repo'; // Folder sementara untuk mengkloning repo
const OUTPUT_FILE = './knowledge_base.json'; // File output yang akan digunakan oleh frontend
const INCLUDED_EXTENSIONS = ['.md', '.js', '.py', '.html', '.css']; // Ekstensi file yang ingin dibaca
// ------------------------------------

async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(REPO_DIR, filePath);
    // Kita format agar jelas dari file mana konten berasal
    return `--- START OF FILE: ${relativePath} ---\n${content}\n--- END OF FILE: ${relativePath} ---\n\n`;
  } catch (error) {
    console.error(`Gagal membaca file ${filePath}:`, error);
    return '';
  }
}

async function walkDir(dir) {
  let fileContents = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Hindari folder .git
      if (entry.name !== '.git') {
        fileContents += await walkDir(fullPath);
      }
    } else if (INCLUDED_EXTENSIONS.includes(path.extname(entry.name))) {
      fileContents += await processFile(fullPath);
    }
  }
  return fileContents;
}

async function main() {
  console.log(`Menghapus direktori lama jika ada: ${REPO_DIR}`);
  await fs.rm(REPO_DIR, { recursive: true, force: true });

  console.log(`Mulai mengkloning repo dari ${REPO_URL}...`);
  const git = simpleGit();
  await git.clone(REPO_URL, REPO_DIR);
  console.log('Kloning selesai.');

  console.log('Membaca dan menggabungkan file...');
  const allContent = await walkDir(REPO_DIR);

  console.log(`Menyimpan semua konten ke ${OUTPUT_FILE}...`);
  // Kita simpan dalam format JSON agar mudah di-fetch oleh browser
  const outputData = {
    repoUrl: REPO_URL,
    generatedAt: new Date().toISOString(),
    content: allContent
  };
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));

  console.log('Selesai! File knowledge_base.json telah dibuat.');
  console.log('Jangan lupa unggah file ini bersama index.html ke GitHub Pages.');

  console.log(`Menghapus direktori sementara: ${REPO_DIR}`);
  await fs.rm(REPO_DIR, { recursive: true, force: true });
}

main().catch(console.error);
