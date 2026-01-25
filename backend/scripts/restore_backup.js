const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { restoreDatabaseBackup } = require('../core/database');

(async () => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    let backupPath = process.argv[2]; // Allow backup file path as command line argument
    
    // If no argument provided, try to find backup file
    if (!backupPath) {
      // First try the expected name
      const expectedPath = path.join(uploadsDir, 'ExperionTas_Site');
      if (fs.existsSync(expectedPath)) {
        backupPath = expectedPath;
      } else {
        // Look for .bak files
        const files = fs.readdirSync(uploadsDir, { withFileTypes: true })
          .filter(dirent => dirent.isFile())
          .map(dirent => dirent.name)
          .filter(name => name.endsWith('.bak') || !name.includes('.'))
          .map(name => path.join(uploadsDir, name));
        
        if (files.length > 0) {
          backupPath = files[0];
          console.log(`Found backup file: ${path.basename(backupPath)}`);
        } else {
          throw new Error(`No backup file found in ${uploadsDir}. Please provide a backup file path or place a .bak file in the uploads folder.`);
        }
      }
    }
    
    // Resolve to absolute path
    backupPath = path.resolve(backupPath);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    console.log('Starting database restore from:', backupPath);
    
    const result = await restoreDatabaseBackup(backupPath);
    
    console.log('\n=== Restore Complete ===');
    console.log('Tables found:', result.tables.join(', '));
    console.log('Database restored successfully!');
    
  } catch (error) {
    console.error('Restore failed:', error.message);
    if (error.precedingErrors) {
      error.precedingErrors.forEach(err => {
        console.error('  -', err.message);
      });
    }
    process.exitCode = 1;
  }
})();

