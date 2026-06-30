import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  VideoLibrary as VideoLibraryIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { adminAPI } from '../services/api';

const CallRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [openPlayerDialog, setOpenPlayerDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    totalRecordings: 0,
    totalSize: 0,
    averageDuration: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getVideoCallRecordings();
      const recordingsData = response.data?.recordings || [];
      setRecordings(recordingsData);
      calculateStats(recordingsData);
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (recordingsData) => {
    const totalSize = recordingsData.reduce((sum, r) => sum + (r.file_size || 0), 0);
    const durations = recordingsData.filter(r => r.duration_minutes);
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, r) => sum + r.duration_minutes, 0) / durations.length
      : 0;

    setStats({
      totalRecordings: recordingsData.length,
      totalSize: (totalSize / (1024 * 1024 * 1024)).toFixed(2), // Convert to GB
      averageDuration: avgDuration.toFixed(1),
    });
  };

  const handlePlayRecording = (recording) => {
    setSelectedRecording(recording);
    setOpenPlayerDialog(true);
  };

  const handleDownloadRecording = async (recording) => {
    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = recording.recording_url;
      link.download = `recording_${recording.session_id}_${recording.coach_name}_${recording.student_name}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading recording:', error);
      alert('Failed to download recording');
    }
  };

  const handleDeleteClick = (recording) => {
    setDeleteTarget(recording);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      await adminAPI.deleteVideoCallRecording(deleteTarget.id);
      setRecordings(recordings.filter(r => r.id !== deleteTarget.id));
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting recording:', error);
      alert('Failed to delete recording: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredRecordings = recordings.filter(recording => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      recording.coach_name?.toLowerCase().includes(query) ||
      recording.student_name?.toLowerCase().includes(query) ||
      recording.session_id?.toString().includes(query)
    );
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const renderStats = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Recordings
            </Typography>
            <Typography variant="h4">{stats.totalRecordings}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Storage
            </Typography>
            <Typography variant="h4">{stats.totalSize} GB</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Avg Duration
            </Typography>
            <Typography variant="h4">{stats.averageDuration} min</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <VideoLibraryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Call Recordings
      </Typography>

      <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
        <strong>Privacy Notice:</strong> All video call sessions are recorded for quality assurance and training purposes.
        Recordings are automatically deleted after 90 days. Handle recordings with care and respect user privacy.
      </Alert>

      {renderStats()}

      <Paper sx={{ mt: 3 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search by coach, student, or session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ width: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Session ID</TableCell>
                  <TableCell>Coach</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Recorded At</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>File Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading recordings...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRecordings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No recordings found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecordings.map((recording) => (
                    <TableRow key={recording.id}>
                      <TableCell>{recording.session_id}</TableCell>
                      <TableCell>{recording.coach_name}</TableCell>
                      <TableCell>{recording.student_name}</TableCell>
                      <TableCell>
                        {recording.recorded_at
                          ? format(parseISO(recording.recorded_at), 'MMM dd, yyyy HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>{recording.duration_minutes || '-'} min</TableCell>
                      <TableCell>{formatFileSize(recording.file_size)}</TableCell>
                      <TableCell>
                        <Chip
                          label={recording.processing_status || 'Available'}
                          color={recording.processing_status === 'processing' ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {recording.recording_url && (
                            <>
                              <Tooltip title="Play Recording">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handlePlayRecording(recording)}
                                >
                                  <PlayIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleDownloadRecording(recording)}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Delete Recording">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(recording)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Video Player Dialog */}
      <Dialog
        open={openPlayerDialog}
        onClose={() => setOpenPlayerDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Recording - Session {selectedRecording?.session_id}
        </DialogTitle>
        <DialogContent>
          {selectedRecording && selectedRecording.recording_url ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {selectedRecording.coach_name} with {selectedRecording.student_name}
              </Typography>
              <Typography variant="caption" color="textSecondary" gutterBottom>
                {format(parseISO(selectedRecording.recorded_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
              <Box sx={{ mt: 2, bgcolor: 'black', borderRadius: 1 }}>
                <video
                  controls
                  style={{ width: '100%', maxHeight: '70vh' }}
                  src={selectedRecording.recording_url}
                >
                  Your browser does not support video playback.
                </video>
              </Box>
            </Box>
          ) : (
            <Typography>Recording not available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlayerDialog(false)}>Close</Button>
          {selectedRecording?.recording_url && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleDownloadRecording(selectedRecording)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>
          <WarningIcon sx={{ color: 'error.main', mr: 1, verticalAlign: 'middle' }} />
          Delete Recording
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this recording?
          </Typography>
          {deleteTarget && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">Session ID: {deleteTarget.session_id}</Typography>
              <Typography variant="body2">
                {deleteTarget.coach_name} with {deleteTarget.student_name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {format(parseISO(deleteTarget.recorded_at), 'MMM dd, yyyy HH:mm')}
              </Typography>
            </Box>
          )}
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The recording file will be permanently deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            startIcon={<DeleteIcon />}
          >
            Delete Recording
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CallRecordings;
