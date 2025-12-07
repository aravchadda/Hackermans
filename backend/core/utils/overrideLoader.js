const fs = require('fs');
const path = require('path');

/**
 * Override Loader Utility
 * 
 * This utility allows loading functions from the core/ directory,
 * with the ability to override them from the overrides/ directory.
 * 
 * Usage:
 *   const loader = require('./core/utils/overrideLoader');
 *   const myFunction = loader.load('routes', 'schema');
 *   // This will load overrides/routes/schema.js if it exists,
 *   // otherwise it will load core/routes/schema.js
 */

/**
 * Loads a module from overrides/ if it exists, otherwise from core/
 * @param {string} category - The category folder (routes, middleware, utils, database)
 * @param {string} moduleName - The name of the module (without .js extension)
 * @returns {object} The loaded module
 */
const loadModule = (category, moduleName) => {
  const overridePath = path.join(__dirname, '../../overrides', category, `${moduleName}.js`);
  const corePath = path.join(__dirname, '..', category, `${moduleName}.js`);
  
  // Check if override exists
  if (fs.existsSync(overridePath)) {
    console.log(`📦 Loading override: ${category}/${moduleName}`);
    return require(overridePath);
  }
  
  // Fall back to core
  if (fs.existsSync(corePath)) {
    return require(corePath);
  }
  
  throw new Error(`Module not found: ${category}/${moduleName} (checked overrides and core)`);
};

/**
 * Loads a specific function from a module
 * @param {string} category - The category folder
 * @param {string} moduleName - The name of the module
 * @param {string} functionName - The name of the function to load
 * @returns {function} The loaded function
 */
const loadFunction = (category, moduleName, functionName) => {
  const module = loadModule(category, moduleName);
  
  if (typeof module[functionName] !== 'function') {
    throw new Error(`Function ${functionName} not found in ${category}/${moduleName}`);
  }
  
  return module[functionName];
};

/**
 * Loads an entire module and returns it
 * @param {string} category - The category folder
 * @param {string} moduleName - The name of the module
 * @returns {object} The loaded module
 */
const load = (category, moduleName) => {
  return loadModule(category, moduleName);
};

/**
 * Checks if an override exists for a module
 * @param {string} category - The category folder
 * @param {string} moduleName - The name of the module
 * @returns {boolean} True if override exists
 */
const hasOverride = (category, moduleName) => {
  const overridePath = path.join(__dirname, '../../overrides', category, `${moduleName}.js`);
  return fs.existsSync(overridePath);
};

module.exports = {
  load,
  loadFunction,
  loadModule,
  hasOverride
};

