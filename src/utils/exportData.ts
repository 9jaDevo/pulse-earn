/**
 * Utility functions for exporting data to CSV format
 */

/**
 * Convert an array of objects to CSV format
 * 
 * @param data Array of objects to convert
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string => {
  if (data.length === 0) return '';
  
  // Determine headers from data if not provided
  const actualHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = actualHeaders.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return actualHeaders.map(header => {
      // Get the value for this header
      const value = item[header];
      
      // Format the value properly for CSV
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = value.replace(/"/g, '""');
        return /[",\n\r]/.test(value) ? `"${escaped}"` : escaped;
      } else if (typeof value === 'object' && value instanceof Date) {
        return value.toISOString();
      } else if (typeof value === 'object') {
        // For objects, convert to JSON string and escape
        const jsonStr = JSON.stringify(value).replace(/"/g, '""');
        return `"${jsonStr}"`;
      } else {
        return String(value);
      }
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Download data as a CSV file
 * 
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export const downloadCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }
  
  // Convert data to CSV
  const csv = convertToCSV(data, headers);
  
  // Create a Blob with the CSV data
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add to document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Format data for export based on data type
 * 
 * @param dataType Type of data being exported
 * @param data Raw data to format
 * @returns Formatted data ready for CSV export
 */
export const formatDataForExport = (
  dataType: 'users' | 'polls' | 'activity' | 'countries' | 'growth' | 'trivia',
  data: any[]
): Record<string, any>[] => {
  switch (dataType) {
    case 'users':
      return data.map(user => ({
        ID: user.id,
        Email: user.email,
        Name: user.name || 'N/A',
        Country: user.country || 'N/A',
        Role: user.role,
        Points: user.points,
        Badges: (user.badges || []).join(', '),
        Created: new Date(user.created_at).toLocaleString(),
        Status: user.is_suspended ? 'Suspended' : 'Active'
      }));
      
    case 'polls':
      return data.map(poll => ({
        ID: poll.id,
        Title: poll.title,
        Description: poll.description || 'N/A',
        Category: poll.category || 'N/A',
        Type: poll.type,
        Country: poll.country || 'Global',
        Votes: poll.total_votes,
        Status: poll.is_active ? 'Active' : 'Inactive',
        Created: new Date(poll.created_at).toLocaleString(),
        CreatedBy: poll.created_by
      }));
      
    case 'activity':
      return data.map(activity => ({
        Type: activity.type,
        Message: activity.message,
        Time: activity.time,
        Timestamp: new Date(activity.timestamp).toLocaleString()
      }));
      
    case 'countries':
      return data.map(country => ({
        Country: country.country,
        Users: country.count,
        Percentage: `${country.percentage.toFixed(1)}%`
      }));
      
    case 'growth':
      return data.map(day => ({
        Date: day.date,
        NewUsers: day.count
      }));
      
    case 'trivia':
      return data.map(item => ({
        Difficulty: item.difficulty,
        Completions: item.count,
        AverageScore: `${item.score}%`
      }));
      
    default:
      return data;
  }
};