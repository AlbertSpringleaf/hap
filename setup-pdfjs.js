const https = require('https');
const fs = require('fs');
const path = require('path');

const PDFJS_VERSION = '3.11.174';
const BASE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;

// Alleen de worker downloaden
const filesToDownload = [
  {
    url: `${BASE_URL}/build/pdf.worker.min.js`,
    dest: 'public/pdf.worker.min.js'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    // Maak de directory aan als deze niet bestaat
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function setupPdfJs() {
  console.log('Setting up PDF.js worker...');
  
  for (const file of filesToDownload) {
    try {
      console.log(`Downloading: ${file.url} to ${file.dest}`);
      await downloadFile(file.url, file.dest);
      console.log(`Successfully downloaded: ${file.dest}`);
    } catch (error) {
      console.error(`Error processing ${file.url}:`, error);
    }
  }
  
  console.log('PDF.js setup complete!');
}

setupPdfJs().catch(console.error); 