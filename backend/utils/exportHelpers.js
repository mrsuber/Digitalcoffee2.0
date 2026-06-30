// Export Helper Utilities for Admin Dashboard
// Supports CSV and Excel exports

const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');

/**
 * Convert JSON data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} fields - Optional array of field configurations
 * @returns {String} CSV formatted string
 */
const convertToCSV = (data, fields = null) => {
  try {
    if (!data || data.length === 0) {
      return 'No data available';
    }

    const opts = fields ? { fields } : {};
    const parser = new Parser(opts);
    return parser.parse(data);
  } catch (error) {
    console.error('CSV conversion error:', error);
    throw new Error('Failed to convert data to CSV');
  }
};

/**
 * Create Excel workbook with formatted data
 * @param {Array} data - Array of objects to export
 * @param {String} sheetName - Name of the worksheet
 * @param {Array} columns - Column configurations
 * @returns {ExcelJS.Workbook} Excel workbook object
 */
const createExcelWorkbook = async (data, sheetName = 'Data', columns = null) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Auto-generate columns from data if not provided
    if (!columns && data.length > 0) {
      columns = Object.keys(data[0]).map(key => ({
        header: key.replace(/_/g, ' ').toUpperCase(),
        key: key,
        width: 20
      }));
    }

    worksheet.columns = columns;

    // Style the header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' } // Green color
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    data.forEach(item => {
      worksheet.addRow(item);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, cell => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    return workbook;
  } catch (error) {
    console.error('Excel creation error:', error);
    throw new Error('Failed to create Excel file');
  }
};

/**
 * Format mood analytics data for export
 */
const formatMoodAnalyticsForExport = (data) => {
  const exportData = [];

  // Mood Distribution
  if (data.moodDistribution && data.moodDistribution.length > 0) {
    data.moodDistribution.forEach(item => {
      exportData.push({
        category: 'Mood Distribution',
        mood: item.mood,
        count: item.count,
        date: new Date().toLocaleDateString()
      });
    });
  }

  // Focus Distribution
  if (data.focusDistribution && data.focusDistribution.length > 0) {
    data.focusDistribution.forEach(item => {
      exportData.push({
        category: 'Focus Distribution',
        focus_level: item.focus_level,
        count: item.count,
        date: new Date().toLocaleDateString()
      });
    });
  }

  return exportData;
};

/**
 * Format user activity data for export
 */
const formatUserActivityForExport = (logs) => {
  return logs.map(log => ({
    user_email: log.user_email,
    user_name: log.user_name || 'N/A',
    activity_type: log.activity_type,
    device_type: log.device_type || 'Unknown',
    platform: log.platform || 'Unknown',
    ip_address: log.ip_address || 'N/A',
    session_duration_seconds: log.session_duration_seconds || 0,
    created_at: new Date(log.created_at).toLocaleString()
  }));
};

/**
 * Format journal data for export
 */
const formatJournalsForExport = (journals) => {
  return journals.map(journal => ({
    user_email: journal.user_email,
    user_name: journal.user_name || 'N/A',
    mood: journal.mood || 'N/A',
    content_preview: journal.content ? journal.content.substring(0, 100) + '...' : '',
    tags: journal.tags || 'None',
    is_favorite: journal.is_favorite ? 'Yes' : 'No',
    created_at: new Date(journal.created_at).toLocaleString()
  }));
};

/**
 * Format progress analytics for export
 */
const formatProgressAnalyticsForExport = (userProgress) => {
  return userProgress.map(user => ({
    user_name: user.user_name || 'N/A',
    user_email: user.user_email,
    total_sessions: user.total_sessions || 0,
    total_minutes: user.total_minutes || 0,
    current_streak: user.current_streak || 0,
    avg_mood: user.avg_mood || 0,
    avg_focus: user.avg_focus || 0,
    courses_enrolled: user.courses_enrolled || 0,
    courses_completed: user.courses_completed || 0,
    last_active: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'
  }));
};

module.exports = {
  convertToCSV,
  createExcelWorkbook,
  formatMoodAnalyticsForExport,
  formatUserActivityForExport,
  formatJournalsForExport,
  formatProgressAnalyticsForExport
};
