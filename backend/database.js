const Database = require('duckdb').Database;
const path = require('path');
const fs = require('fs');

let db = null;

const connectDatabase = async () => {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = './data/hackermans.db';
      const dbDir = path.dirname(dbPath);
      
      // Ensure data directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      db = new Database(dbPath, (err) => {
        if (err) {
          console.error(' Database connection failed:', err);
          reject(err);
        } else {
          console.log(' DuckDB connected successfully');
          initializeTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    } catch (error) {
      console.error(' Database initialization error:', error);
      reject(error);
    }
  });
};

const initializeTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS sample_data (
      id INTEGER PRIMARY KEY,
      name VARCHAR NOT NULL,
      value INTEGER,
      category VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS datasets (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      file_path VARCHAR,
      file_type VARCHAR,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSON
    )`,
    
    `CREATE TABLE IF NOT EXISTS dashboards (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      layout JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id VARCHAR
    )`,
    
    `CREATE TABLE IF NOT EXISTS shipments (
      GrossQuantity DECIMAL,
      FlowRate DECIMAL,
      ShipmentCompartmentID VARCHAR,
      BaseProductID VARCHAR,
      BaseProductCode VARCHAR,
      ShipmentID VARCHAR,
      ShipmentCode VARCHAR,
      ExitTime VARCHAR,
      BayCode VARCHAR,
      ScheduledDate VARCHAR,
      CreatedTime VARCHAR
    )`,
    
    `CREATE TABLE IF NOT EXISTS dashboard_layout (
      id INTEGER PRIMARY KEY,
      layout_data JSON,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
  ];
  
  for (const query of queries) {
    await runQuery(query);
  }
  
  // Insert sample data if table is empty
  const count = await runQueryCount('SELECT COUNT(*) as count FROM sample_data');
  if (count === 0) {
    const sampleData = [
      ['Product A', 100, 'Electronics'],
      ['Product B', 150, 'Electronics'],
      ['Product C', 75, 'Clothing'],
      ['Product D', 200, 'Electronics'],
      ['Product E', 50, 'Clothing'],
      ['Product F', 300, 'Electronics'],
      ['Product G', 120, 'Clothing'],
      ['Product H', 80, 'Electronics'],
      ['Product I', 90, 'Clothing'],
      ['Product J', 250, 'Electronics']
    ];
    
    // Use DuckDB run pattern with direct string interpolation
    const database = getDatabase();
    
    for (const [name, value, category] of sampleData) {
      database.run(`INSERT INTO sample_data (name, value, category) VALUES ('${name}', ${value}, '${category}')`);
    }
    
    console.log(' Sample data inserted');
  }
  
  // Load shipment data from CSV
  await loadShipmentData();
  
  console.log(' Database tables initialized');
};

const loadShipmentData = async () => {
  try {
    const database = getDatabase();
    
    // Check if shipment data already exists
    const shipmentCount = await runQueryCount('SELECT COUNT(*) as count FROM shipments');
    
    if (shipmentCount === 0) {
      console.log('📦 Loading shipment data from CSV...');
      
      // Use DuckDB's CSV reading capability
      await runQuery(`
        INSERT INTO shipments 
        SELECT * FROM read_csv_auto('./Shipment 1.xlsx - Sheet1.csv', header=true)
      `);
      
      const finalCount = await runQueryCount('SELECT COUNT(*) as count FROM shipments');
      console.log(` Loaded ${finalCount} shipment records`);
    } else {
      console.log(` Shipment data already loaded (${shipmentCount} records)`);
    }
  } catch (error) {
    console.error('Error loading shipment data:', error);
  }
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
};

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    if (params && params.length > 0) {
      database.all(query, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          const serialized = rows.map(row => {
            const newRow = {};
            for (const key in row) {
              const value = row[key];
              newRow[key] = typeof value === "bigint" ? value.toString() : value;
            }
            return newRow;
          });
          resolve(serialized);
        }
      });
    } else {
      database.all(query, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          const serialized = rows.map(row => {
            const newRow = {};
            for (const key in row) {
              const value = row[key];
              newRow[key] = typeof value === "bigint" ? value.toString() : value;
            }
            return newRow;
          });
          resolve(serialized);
        }
      });
    }
  });
};

const runQueryFirst = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    if (params && params.length > 0) {
      database.all(query, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          if (rows && rows.length > 0) {
            const row = rows[0];
            const serialized = {};
            for (const key in row) {
              const value = row[key];
              serialized[key] = typeof value === "bigint" ? value.toString() : value;
            }
            resolve(serialized);
          } else {
            resolve(null);
          }
        }
      });
    } else {
      database.all(query, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          if (rows && rows.length > 0) {
            const row = rows[0];
            const serialized = {};
            for (const key in row) {
              const value = row[key];
              serialized[key] = typeof value === "bigint" ? value.toString() : value;
            }
            resolve(serialized);
          } else {
            resolve(null);
          }
        }
      });
    }
  });
};

const runQueryCount = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    if (params && params.length > 0) {
      database.all(query, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          if (rows && rows.length > 0) {
            const row = rows[0];
            const count = typeof row.count === "bigint" ? row.count.toString() : row.count;
            resolve(parseInt(count) || 0);
          } else {
            resolve(0);
          }
        }
      });
    } else {
      database.all(query, (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          if (rows && rows.length > 0) {
            const row = rows[0];
            const count = typeof row.count === "bigint" ? row.count.toString() : row.count;
            resolve(parseInt(count) || 0);
          } else {
            resolve(0);
          }
        }
      });
    }
  });
};

const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = {
  connectDatabase,
  getDatabase,
  runQuery,
  runQueryFirst,
  runQueryCount,
  closeDatabase
};
