const fs = require('node:fs/promises');
const path = require('node:path');

async function audit(event, details) {
  try {
    const directory = path.join(__dirname, '../../logs');
    await fs.mkdir(directory, { recursive: true });
    await fs.appendFile(path.join(directory, 'audit.log'), JSON.stringify({ timestamp: new Date().toISOString(), event, ...details }) + '\n');
    return true;
  } catch (error) {
    console.error('Audit log failed:', error.message);
    return false;
  }
}

module.exports = audit;
