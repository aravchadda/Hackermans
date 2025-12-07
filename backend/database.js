/**
 * Compatibility shim for database.js
 * 
 * This file maintains backward compatibility for any code that still
 * references the old database.js location.
 * 
 * The actual database code has been moved to core/database/index.js
 * and can be overridden via overrides/database/index.js
 */

// Use the override loader to get the database module (supports overrides)
const overrideLoader = require('./core/utils/overrideLoader');
const dbModule = overrideLoader.load('database', 'index');

// Re-export all database functions
module.exports = dbModule;
