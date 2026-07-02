import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  Chip,
  Paper,
} from '@mui/material';
import { Save as SaveIcon, History as HistoryIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://digitalcoffee.cafe/api';

const LegalDocuments = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [termsOfService, setTermsOfService] = useState({
    title: '',
    content: '',
    version: '',
    last_updated: null,
    updated_by_name: null,
  });

  const [privacyPolicy, setPrivacyPolicy] = useState({
    title: '',
    content: '',
    version: '',
    last_updated: null,
    updated_by_name: null,
  });

  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);

      // Load Terms of Service
      const termsResponse = await axios.get(
        `${API_URL}/legal/admin/documents/terms_of_service`,
        getAuthHeaders()
      );

      if (termsResponse.data.success) {
        setTermsOfService(termsResponse.data.data);
      }

      // Load Privacy Policy
      const privacyResponse = await axios.get(
        `${API_URL}/legal/admin/documents/privacy_policy`,
        getAuthHeaders()
      );

      if (privacyResponse.data.success) {
        setPrivacyPolicy(privacyResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setSnackbar({
        open: true,
        message: 'Error loading documents',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (documentType) => {
    try {
      const response = await axios.get(
        `${API_URL}/legal/admin/documents/${documentType}/history`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setHistory(response.data.data);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setSnackbar({
        open: true,
        message: 'Error loading document history',
        severity: 'error',
      });
    }
  };

  const saveDocument = async (documentType, data) => {
    try {
      setSaving(true);

      const response = await axios.put(
        `${API_URL}/legal/admin/documents/${documentType}`,
        data,
        getAuthHeaders()
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Document saved successfully',
          severity: 'success',
        });

        // Reload documents to get updated data
        await loadDocuments();
      }
    } catch (error) {
      console.error('Error saving document:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error saving document',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = () => {
    saveDocument('terms_of_service', {
      title: termsOfService.title,
      content: termsOfService.content,
      version: termsOfService.version,
    });
  };

  const handleSavePrivacy = () => {
    saveDocument('privacy_policy', {
      title: privacyPolicy.title,
      content: privacyPolicy.content,
      version: privacyPolicy.version,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Legal Documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage Terms of Service and Privacy Policy
        </Typography>
      </Box>

      <Card>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Terms of Service" />
          <Tab label="Privacy Policy" />
        </Tabs>

        <CardContent>
          {activeTab === 0 && (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Version: <strong>{termsOfService.version}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated: <strong>{formatDate(termsOfService.last_updated)}</strong>
                    </Typography>
                  </Grid>
                  {termsOfService.updated_by_name && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Updated By: <strong>{termsOfService.updated_by_name}</strong>
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <TextField
                fullWidth
                label="Title"
                value={termsOfService.title}
                onChange={(e) =>
                  setTermsOfService({ ...termsOfService, title: e.target.value })
                }
                margin="normal"
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Version"
                value={termsOfService.version}
                onChange={(e) =>
                  setTermsOfService({ ...termsOfService, version: e.target.value })
                }
                margin="normal"
                variant="outlined"
                helperText="e.g., 1.0, 2.0, 2.1"
              />

              <TextField
                fullWidth
                label="Content (Markdown Supported)"
                value={termsOfService.content}
                onChange={(e) =>
                  setTermsOfService({ ...termsOfService, content: e.target.value })
                }
                margin="normal"
                variant="outlined"
                multiline
                rows={20}
                helperText="You can use Markdown formatting (# for headers, ** for bold, etc.)"
              />

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveTerms}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => loadHistory('terms_of_service')}
                >
                  View History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => window.open(`${API_URL}/legal/documents/terms_of_service`, '_blank')}
                >
                  Preview (API)
                </Button>
              </Box>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Version: <strong>{privacyPolicy.version}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated: <strong>{formatDate(privacyPolicy.last_updated)}</strong>
                    </Typography>
                  </Grid>
                  {privacyPolicy.updated_by_name && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Updated By: <strong>{privacyPolicy.updated_by_name}</strong>
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              <TextField
                fullWidth
                label="Title"
                value={privacyPolicy.title}
                onChange={(e) =>
                  setPrivacyPolicy({ ...privacyPolicy, title: e.target.value })
                }
                margin="normal"
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Version"
                value={privacyPolicy.version}
                onChange={(e) =>
                  setPrivacyPolicy({ ...privacyPolicy, version: e.target.value })
                }
                margin="normal"
                variant="outlined"
                helperText="e.g., 1.0, 2.0, 2.1"
              />

              <TextField
                fullWidth
                label="Content (Markdown Supported)"
                value={privacyPolicy.content}
                onChange={(e) =>
                  setPrivacyPolicy({ ...privacyPolicy, content: e.target.value })
                }
                margin="normal"
                variant="outlined"
                multiline
                rows={20}
                helperText="You can use Markdown formatting (# for headers, ** for bold, etc.)"
              />

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePrivacy}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => loadHistory('privacy_policy')}
                >
                  View History
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => window.open(`${API_URL}/legal/documents/privacy_policy`, '_blank')}
                >
                  Preview (API)
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      {showHistory && history.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Document History</Typography>
              <Button onClick={() => setShowHistory(false)}>Close</Button>
            </Box>

            {history.map((item, index) => (
              <Paper key={item.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">
                      Version {item.version}
                      <Chip
                        label={index === 0 ? 'Previous' : `${index} versions ago`}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Updated: {formatDate(item.created_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      By: {item.updated_by_name || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{
                      maxHeight: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.content.substring(0, 200)}...
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LegalDocuments;
