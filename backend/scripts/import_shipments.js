const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDatabase, importShipmentsCsv, closeDatabase, runQueryCount } = require('../core/database');

(async () => {
  try {
    await connectDatabase();
    const csvPath = path.join(__dirname, '..', 'Shipment 1.xlsx - Sheet1.csv');
    console.log('Importing CSV:', csvPath);
    await importShipmentsCsv(csvPath);
    const count = await runQueryCount('SELECT COUNT(*) as count FROM shipments');
    console.log(`Done. Imported ${count} rows into shipments.`);
  } catch (e) {
    console.error('Import failed:', e);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
})();


