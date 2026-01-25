import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parse uploaded data file based on type
 */
export const parseDataFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let data;
        
        if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
          data = parseCSV(content);
        } else if (fileType === 'application/json' || fileName.endsWith('.json')) {
          data = parseJSON(content);
        } else if (fileType.includes('sheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          data = parseExcel(content);
        } else {
          throw new Error('Unsupported file type');
        }
        
        if (!data || data.length === 0) {
          throw new Error('No data found in file');
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse CSV content
 */
const parseCSV = (content) => {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};

/**
 * Parse JSON content
 */
const parseJSON = (content) => {
  try {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'object' && data !== null) {
      // If it's an object, try to find an array property
      const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayKeys.length > 0) {
        return data[arrayKeys[0]];
      }
      throw new Error('JSON must contain an array of objects');
    } else {
      throw new Error('JSON must be an array of objects');
    }
  } catch (error) {
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
};

/**
 * Parse Excel content
 */
const parseExcel = (content) => {
  try {
    const workbook = XLSX.read(content, { type: 'binary' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      throw new Error('Excel file must have at least a header row and one data row');
    }
    
    // Convert to array of objects
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error.message}`);
  }
};

/**
 * Detect data schema from parsed data
 */
export const detectSchema = (data) => {
  if (!data || data.length === 0) {
    return [];
  }
  
  const sample = data.slice(0, Math.min(100, data.length)); // Use first 100 rows for analysis
  const fields = Object.keys(sample[0]);
  
  return fields.map(fieldName => {
    const values = sample.map(row => row[fieldName]).filter(val => val !== null && val !== undefined && val !== '');
    
    if (values.length === 0) {
      return { name: fieldName, type: 'nominal' };
    }
    
    // Check for temporal data
    if (isTemporalField(values)) {
      return { name: fieldName, type: 'temporal' };
    }
    
    // Check for quantitative data
    if (isQuantitativeField(values)) {
      return { name: fieldName, type: 'quantitative' };
    }
    
    // Check for ordinal data
    if (isOrdinalField(values)) {
      return { name: fieldName, type: 'ordinal' };
    }
    
    // Default to nominal
    return { name: fieldName, type: 'nominal' };
  });
};

/**
 * Check if field contains temporal data
 */
const isTemporalField = (values) => {
  const temporalPatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // Month names
    /^\d{4}$/ // Year only
  ];
  
  const temporalCount = values.filter(val => {
    const str = String(val).trim();
    return temporalPatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
  }).length;
  
  return temporalCount / values.length > 0.7;
};

/**
 * Check if field contains quantitative data
 */
const isQuantitativeField = (values) => {
  const numericCount = values.filter(val => {
    const num = Number(val);
    return !isNaN(num) && isFinite(num);
  }).length;
  
  return numericCount / values.length > 0.8;
};

/**
 * Check if field contains ordinal data
 */
const isOrdinalField = (values) => {
  const uniqueValues = [...new Set(values.map(String))];
  
  // Check for common ordinal patterns
  const ordinalPatterns = [
    /^(low|medium|high)$/i,
    /^(small|medium|large)$/i,
    /^(poor|fair|good|excellent)$/i,
    /^(beginner|intermediate|advanced)$/i,
    /^(1st|2nd|3rd|\d+th)$/i,
    /^(first|second|third|fourth|fifth)$/i
  ];
  
  const ordinalCount = uniqueValues.filter(val => 
    ordinalPatterns.some(pattern => pattern.test(val))
  ).length;
  
  return ordinalCount / uniqueValues.length > 0.5 && uniqueValues.length < 20;
};

/**
 * Clean and validate data
 */
export const cleanData = (data) => {
  return data.map(row => {
    const cleanedRow = {};
    Object.keys(row).forEach(key => {
      let value = row[key];
      
      // Clean whitespace
      if (typeof value === 'string') {
        value = value.trim();
      }
      
      // Convert empty strings to null
      if (value === '') {
        value = null;
      }
      
      cleanedRow[key] = value;
    });
    return cleanedRow;
  }).filter(row => {
    // Remove completely empty rows
    return Object.values(row).some(val => val !== null && val !== '');
  });
};

/**
 * Get data statistics
 */
export const getDataStats = (data) => {
  if (!data || data.length === 0) {
    return { rows: 0, columns: 0, fields: [] };
  }
  
  const fields = Object.keys(data[0]);
  const stats = {
    rows: data.length,
    columns: fields.length,
    fields: fields.map(field => {
      const values = data.map(row => row[field]).filter(val => val !== null && val !== undefined && val !== '');
      return {
        name: field,
        nonNullCount: values.length,
        nullCount: data.length - values.length,
        uniqueCount: new Set(values).size
      };
    })
  };
  
  return stats;
};
