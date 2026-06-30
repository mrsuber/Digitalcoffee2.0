import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function ExportButton({
  endpoint,
  params = {},
  label = 'Export',
  style = {}
}) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const toast = useToast();

  const handleExport = async (format) => {
    setLoading(true);
    setShowOptions(false);

    try {
      const queryParams = new URLSearchParams({ ...params, format });
      const apiUrl = import.meta.env.VITE_API_URL || 'https://digitalcoffee.cafe/api';
      const token = localStorage.getItem('adminToken');

      const response = await fetch(`${apiUrl}${endpoint}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from headers or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `export-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/);
        if (match) filename = match[1];
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Successfully exported ${format === 'excel' ? 'Excel' : 'CSV'} file`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#10b981',
          color: 'white',
          border: 'none',
          opacity: loading ? 0.6 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
          ...style
        }}
      >
        <Download size={16} />
        {loading ? 'Exporting...' : label}
      </button>

      {showOptions && !loading && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          right: 0,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: '150px'
        }}>
          <button
            onClick={() => handleExport('csv')}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#374151',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <FileText size={16} />
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#374151',
              transition: 'background 0.2s',
              borderRadius: '0 0 0.5rem 0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <FileSpreadsheet size={16} />
            Export as Excel
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {showOptions && (
        <div
          onClick={() => setShowOptions(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}
