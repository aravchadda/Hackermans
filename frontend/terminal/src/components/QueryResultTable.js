import React from 'react';

const QueryResultTable = ({ data, columns, title = "Query Results", page = 1, totalCount = 0, onPageChange, isLoading = false }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 my-2">
        <p className="text-slate-600 dark:text-slate-400 text-sm">No data returned from query.</p>
      </div>
    );
  }

  // If columns are not provided, extract them from the first row
  const tableColumns = columns || Object.keys(data[0]);
  
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = page || 1;
  const startRow = (currentPage - 1) * limit + 1;
  const endRow = Math.min(currentPage * limit, totalCount);
  
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
            {data.map((row, rowIndex) => (
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
        
        {/* Pagination Controls */}
        {totalCount > limit && onPageChange && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-slate-600 dark:text-slate-400 text-xs">
              Showing {startRow} to {endRow} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  currentPage === 1 || isLoading
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : isLoading
                          ? 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  currentPage >= totalPages || isLoading
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryResultTable;
