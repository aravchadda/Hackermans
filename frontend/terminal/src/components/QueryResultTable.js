import React from 'react';

const QueryResultTable = ({ data, columns, title = "Query Results" }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 my-2">
        <p className="text-slate-600 dark:text-slate-400 text-sm">No data returned from query.</p>
      </div>
    );
  }

  // If columns are not provided, extract them from the first row
  const tableColumns = columns || Object.keys(data[0]);
  
  return (
    <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 my-2">
      <h4 className="text-slate-900 dark:text-slate-100 font-semibold text-sm mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-200 dark:bg-slate-600">
              {tableColumns.map((column, index) => (
                <th 
                  key={index}
                  className="px-3 py-2 text-left text-slate-700 dark:text-slate-300 font-medium border-b border-slate-300 dark:border-slate-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className="hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                {tableColumns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    className="px-3 py-2 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-500"
                  >
                    {row[column] !== null && row[column] !== undefined 
                      ? String(row[column]) 
                      : '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 text-center">
            Showing first 10 rows of {data.length} total results
          </p>
        )}
      </div>
    </div>
  );
};

export default QueryResultTable;
