const sql = require('mssql');
require('dotenv').config();

let pool = null;

const ensureDatabaseExists = async (config, dbName) => {
  const masterConfig = { ...config, database: 'master' };
  const masterPool = await sql.connect(masterConfig);
  try {
    await masterPool.request().query(`IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}') BEGIN CREATE DATABASE [${dbName}] END`);
  } finally {
    await masterPool.close();
  }
};

const connectDatabase = async () => {
  try {
    const {
      DB_HOST = '127.0.0.1',
      DB_PORT = '1433',
      DB_USER = 'sa',
      DB_PASSWORD = 'YourStrong!Passw0rd',
      DB_NAME = 'hackermans'
    } = process.env;

    const baseConfig = {
      user: DB_USER,
      password: DB_PASSWORD,
      server: DB_HOST,
      port: Number(DB_PORT),
      options: {
        encrypt: false,
        trustServerCertificate: true
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    await ensureDatabaseExists(baseConfig, DB_NAME);

    pool = await sql.connect({ ...baseConfig, database: DB_NAME });

    // Verify connection
    await pool.request().query('SELECT 1');
    console.log(' MSSQL connected successfully');

    await initializeTables();
  } catch (error) {
    console.error(' Database initialization error:', error);
    throw error;
  }
};

const initializeTables = async () => {
  const queries = [
    `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='shipments' and xtype='U')
     CREATE TABLE shipments (
      GrossQuantity DECIMAL(18,6),
      FlowRate DECIMAL(18,6),
      ShipmentCompartmentID VARCHAR(255),
      BaseProductID VARCHAR(255),
      BaseProductCode VARCHAR(255),
      ShipmentID VARCHAR(255),
      ShipmentCode VARCHAR(255),
      ExitTime VARCHAR(255),
      BayCode VARCHAR(255),
      ScheduledDate VARCHAR(255),
      CreatedTime VARCHAR(255)
    )`,
    `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='dashboard_layout' and xtype='U')
     CREATE TABLE dashboard_layout (
      id INT PRIMARY KEY,
      layout_data NVARCHAR(MAX),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE()
    )`,
    `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='custom_views' and xtype='U')
     CREATE TABLE custom_views (
      id INT IDENTITY(1,1) PRIMARY KEY,
      view_name NVARCHAR(255) NOT NULL UNIQUE,
      sql_query NVARCHAR(MAX) NOT NULL,
      description NVARCHAR(MAX),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE()
    )`,
    `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='view_columns' and xtype='U')
     CREATE TABLE view_columns (
      id INT IDENTITY(1,1) PRIMARY KEY,
      view_name NVARCHAR(255) NOT NULL,
      column_name NVARCHAR(255) NOT NULL,
      column_description NVARCHAR(MAX),
      data_type NVARCHAR(50),
      created_at DATETIME2 DEFAULT GETDATE(),
      UNIQUE(view_name, column_name)
    )`
  ];

  for (const query of queries) {
    await runQuery(query);
  }

  // Add foreign key constraint after tables are created
  try {
    const fkExists = await runQuery(`
      SELECT COUNT(*) as count
      FROM sys.foreign_keys
      WHERE name = 'FK_view_columns_custom_views'
    `);
    
    if (fkExists[0].count === 0) {
      await runQuery(`
        ALTER TABLE view_columns
        ADD CONSTRAINT FK_view_columns_custom_views
        FOREIGN KEY (view_name) REFERENCES custom_views(view_name) ON DELETE CASCADE
      `);
    }
  } catch (error) {
    // Constraint might already exist or table might not exist yet, ignore
    console.log('Foreign key constraint setup:', error.message);
  }

  console.log(' Database tables initialized');
};

// Note: CSV auto-load was DuckDB-specific and has been removed for MySQL.

const getDatabase = () => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

const runQuery = async (query, params = []) => {
  const database = getDatabase();
  const request = database.request();

  let finalQuery = query;
  if (params && params.length > 0) {
    let paramIndex = 0;
    finalQuery = query.replace(/\?/g, () => {
      paramIndex += 1;
      return `@p${paramIndex}`;
    });

    params.forEach((value, i) => {
      const name = `p${i + 1}`;
      if (typeof value === 'number') {
        if (Number.isInteger(value)) request.input(name, sql.Int, value);
        else request.input(name, sql.Float, value);
      } else if (typeof value === 'boolean') {
        request.input(name, sql.Bit, value);
      } else if (value instanceof Date) {
        request.input(name, sql.DateTime2, value);
      } else if (value === null || value === undefined) {
        request.input(name, sql.NVarChar, null);
      } else if (typeof value === 'object') {
        request.input(name, sql.NVarChar, JSON.stringify(value));
      } else {
        request.input(name, sql.NVarChar, String(value));
      }
    });
  }

  const result = await request.query(finalQuery);
  const rows = result.recordset || [];
  return rows.map(row => {
    const newRow = {};
    for (const key in row) {
      const value = row[key];
      newRow[key] = typeof value === 'bigint' ? value.toString() : value;
    }
    return newRow;
  });
};

const runQueryFirst = async (query, params = []) => {
  const rows = await runQuery(query, params);
  return rows && rows.length > 0 ? rows[0] : null;
};

const runQueryCount = async (query, params = []) => {
  const row = await runQueryFirst(query, params);
  if (!row) return 0;
  const count = typeof row.count === 'bigint' ? row.count.toString() : row.count;
  return parseInt(count) || 0;
};

const closeDatabase = async () => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};

const importShipmentsCsv = async (filePath) => {
  const fs = require('fs');
  const { parse } = require('csv-parse');
  const database = getDatabase();

  // Clear existing data
  await runQuery('DELETE FROM shipments');

  const table = new sql.Table('shipments');
  table.create = false;
  table.columns.add('GrossQuantity', sql.Decimal(18, 6), { nullable: true });
  table.columns.add('FlowRate', sql.Decimal(18, 6), { nullable: true });
  table.columns.add('ShipmentCompartmentID', sql.VarChar(255), { nullable: true });
  table.columns.add('BaseProductID', sql.VarChar(255), { nullable: true });
  table.columns.add('BaseProductCode', sql.VarChar(255), { nullable: true });
  table.columns.add('ShipmentID', sql.VarChar(255), { nullable: true });
  table.columns.add('ShipmentCode', sql.VarChar(255), { nullable: true });
  table.columns.add('ExitTime', sql.VarChar(255), { nullable: true });
  table.columns.add('BayCode', sql.VarChar(255), { nullable: true });
  table.columns.add('ScheduledDate', sql.VarChar(255), { nullable: true });
  table.columns.add('CreatedTime', sql.VarChar(255), { nullable: true });

  await new Promise((resolve, reject) => {
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row) => {
        const num = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
        table.rows.add(
          num(row.GrossQuantity),
          num(row.FlowRate),
          row.ShipmentCompartmentID || null,
          row.BaseProductID || null,
          row.BaseProductCode || null,
          row.ShipmentID || null,
          row.ShipmentCode || null,
          row.ExitTime || null,
          row.BayCode || null,
          row.ScheduledDate || null,
          row.CreatedTime || null
        );
      })
      .on('end', resolve)
      .on('error', reject);
  });

  const request = database.request();
  await request.bulk(table);
};

const restoreDatabaseBackup = async (backupFilePath) => {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');

  const {
    DB_HOST = '127.0.0.1',
    DB_PORT = '1433',
    DB_USER = 'sa',
    DB_PASSWORD = 'YourStrong!Passw0rd',
    DB_NAME = 'hackermans'
  } = process.env;

  // Close existing connection
  if (pool) {
    await pool.close();
    pool = null;
  }

  // Check for Docker container
  let dockerContainerId = null;
  let backupPathInContainer = null;
  
  try {
    const containerId = execSync('docker ps --filter "name=hackermans-mssql" --format "{{.ID}}"', { encoding: 'utf-8' }).trim();
    if (containerId) {
      dockerContainerId = containerId.split('\n')[0];
      console.log(`Found Docker container: ${dockerContainerId}`);
      
      const absolutePath = path.resolve(backupFilePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Backup file not found: ${absolutePath}`);
      }

      // Create backup directory and copy file
      execSync(`docker exec ${dockerContainerId} mkdir -p /var/opt/mssql/backup`, { stdio: 'pipe' });
      backupPathInContainer = '/var/opt/mssql/backup/ExperionTas_Site.bak';
      console.log('Copying backup file to Docker container...');
      execSync(`docker cp "${absolutePath}" ${dockerContainerId}:${backupPathInContainer}`, { stdio: 'inherit' });
      console.log('Backup file copied successfully');
    }
  } catch (error) {
    if (error.message.includes('docker')) {
      console.log('Docker not available, using local path');
    } else {
      throw error;
    }
  }

  // Connect to master database
  const masterConfig = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_HOST,
    port: Number(DB_PORT),
    database: 'master',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      requestTimeout: 600000 // 10 minutes for large backups
    }
  };

  const masterPool = await sql.connect(masterConfig);
  
  try {
    const backupPath = backupPathInContainer || path.resolve(backupFilePath);
    console.log(`Restoring from: ${backupPath}`);

    // Kill connections and set to single user
    try {
      await masterPool.request().query(`
        ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      `);
    } catch (e) {
      console.log('Database might not exist yet');
    }

    // Get file list from backup
    let fileList = [];
    try {
      const fileListResult = await masterPool.request().query(`
        RESTORE FILELISTONLY FROM DISK = '${backupPath.replace(/'/g, "''")}'
      `);
      fileList = fileListResult.recordset;
      console.log(`Found ${fileList.length} files in backup`);
    } catch (e) {
      console.log('Could not read file list, using default names');
      fileList = [
        { LogicalName: 'ExperionTAS', Type: 'D' },
        { LogicalName: 'ExperionTAS_log', Type: 'L' }
      ];
    }

    // Build MOVE clauses
    const moveClauses = fileList.map(file => {
      const logicalName = file.LogicalName;
      const fileName = file.Type === 'D' ? `${DB_NAME}.mdf` : `${DB_NAME}_log.ldf`;
      return `MOVE '${logicalName.replace(/'/g, "''")}' TO '/var/opt/mssql/data/${fileName}'`;
    }).join(',\n      ');

    // Restore database
    const restoreQuery = `
      RESTORE DATABASE [${DB_NAME}]
      FROM DISK = '${backupPath.replace(/'/g, "''")}'
      WITH REPLACE, RECOVERY,
      ${moveClauses}
    `;

    console.log('Starting restore (this may take several minutes)...');
    const request = masterPool.request();
    request.timeout = 600000;
    await request.query(restoreQuery);
    console.log('Restore completed successfully');

    // Set back to multi-user
    await masterPool.request().query(`
      ALTER DATABASE [${DB_NAME}] SET MULTI_USER;
    `);

    // Get table list
    const tablesResult = await masterPool.request().query(`
      SELECT TABLE_NAME 
      FROM [${DB_NAME}].INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    const tables = tablesResult.recordset.map(r => r.TABLE_NAME);
    
    return { success: true, tables };
  } catch (error) {
    // Try to set back to multi-user on error
    try {
      await masterPool.request().query(`ALTER DATABASE [${DB_NAME}] SET MULTI_USER;`);
    } catch (e) {}
    throw error;
  } finally {
    await masterPool.close();
  }
};

module.exports = {
  connectDatabase,
  getDatabase,
  runQuery,
  runQueryFirst,
  runQueryCount,
  closeDatabase,
  importShipmentsCsv,
  restoreDatabaseBackup
};

