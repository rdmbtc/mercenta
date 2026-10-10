const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const htmlPath = path.join(__dirname, '../deploy.html');
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(htmlPath));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3456;
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n======================================================`);
  console.log(` Mercenta Mainnet Deployer UI is live at: ${url}`);
  console.log(`======================================================\n`);
  
  // Open default browser on Windows
  exec(`start ${url}`);
});
