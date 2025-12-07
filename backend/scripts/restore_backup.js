const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { restoreDatabaseBackup } = require('../core/database');

(async () => {
  try {
    const backupPath = path.join(__dirname, '..', 'uploads', 'ExperionTas_Site');
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

