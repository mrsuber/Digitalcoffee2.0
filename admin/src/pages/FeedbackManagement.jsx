import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  BugReport as BugIcon,
  Lightbulb as IdeaIcon,
  Email as EmailIcon,
  Help as HelpIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ResolveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://digitalcoffee.cafe/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');

  // Edit form state
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    bugs: 0,
    features: 0,
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/feedback');

      if (response.data.success) {
        const data = response.data.data;
        setFeedbacks(data);

        // Calculate stats
        const newStats = {
          total: data.length,
          pending: data.filter(f => f.status === 'pending').length,
          in_progress: data.filter(f => f.status === 'in_progress').length,
          resolved: data.filter(f => f.status === 'resolved' || f.status === 'closed').length,
          bugs: data.filter(f => f.type === 'bug').length,
          features: data.filter(f => f.type === 'feature_request').length,
        };
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setDetailsOpen(true);
  };

  const handleEditOpen = (feedback) => {
    setSelectedFeedback(feedback);
    setEditStatus(feedback.status);
    setEditPriority(feedback.priority);
    setEditNotes(feedback.admin_notes || '');
    setEditOpen(true);
  };

  const handleUpdateFeedback = async () => {
    try {
      const response = await api.put(`/admin/feedback/${selectedFeedback.id}`, {
        status: editStatus,
        priority: editPriority,
        admin_notes: editNotes,
      });

      if (response.data.success) {
        setEditOpen(false);
        loadFeedback();
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      setError('Failed to update feedback. Please try again.');
    }
  };

  const handleQuickResolve = async (feedbackId) => {
    try {
      const response = await api.put(`/admin/feedback/${feedbackId}`, {
        status: 'resolved',
      });

      if (response.data.success) {
        loadFeedback();
      }
    } catch (err) {
      console.error('Error resolving feedback:', err);
      setError('Failed to resolve feedback. Please try again.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug':
        return <BugIcon />;
      case 'feature_request':
        return <IdeaIcon />;
      case 'support':
        return <HelpIcon />;
      default:
        return <EmailIcon />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'bug':
        return 'error';
      case 'feature_request':
        return 'info';
      case 'support':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getFilteredFeedback = () => {
    switch (currentTab) {
      case 'pending':
        return feedbacks.filter(f => f.status === 'pending');
      case 'in_progress':
        return feedbacks.filter(f => f.status === 'in_progress');
      case 'resolved':
        return feedbacks.filter(f => f.status === 'resolved' || f.status === 'closed');
      case 'bugs':
        return feedbacks.filter(f => f.type === 'bug');
      case 'features':
        return feedbacks.filter(f => f.type === 'feature_request');
      default:
        return feedbacks;
    }
  };

  const formatDate = (dateString) => {
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
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        Feedback Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4" sx={{ color: '#3b82f6' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" sx={{ color: '#fbbf24' }}>
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h4" sx={{ color: '#3b82f6' }}>
                {stats.in_progress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Resolved
              </Typography>
              <Typography variant="h4" sx={{ color: '#22c55e' }}>
                {stats.resolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Bugs
              </Typography>
              <Typography variant="h4" sx={{ color: '#ef4444' }}>
                {stats.bugs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'rgba(147, 51, 234, 0.1)', borderColor: 'rgba(147, 51, 234, 0.3)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Features
              </Typography>
              <Typography variant="h4" sx={{ color: '#9333ea' }}>
                {stats.features}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All (${stats.total})`} value="all" />
          <Tab
            label={
              <Badge badgeContent={stats.pending} color="warning">
                Pending
              </Badge>
            }
            value="pending"
          />
          <Tab
            label={
              <Badge badgeContent={stats.in_progress} color="info">
                In Progress
              </Badge>
            }
            value="in_progress"
          />
          <Tab label={`Resolved (${stats.resolved})`} value="resolved" />
          <Tab label={`Bugs (${stats.bugs})`} value="bugs" />
          <Tab label={`Features (${stats.features})`} value="features" />
        </Tabs>
      </Card>

      {/* Feedback Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredFeedback().length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" py={4}>
                    No feedback found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              getFilteredFeedback().map((feedback) => (
                <TableRow key={feedback.id} hover>
                  <TableCell>
                    <Chip
                      icon={getTypeIcon(feedback.type)}
                      label={feedback.type.replace('_', ' ')}
                      color={getTypeColor(feedback.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }} noWrap>
                      {feedback.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>{feedback.user_name || 'N/A'}</TableCell>
                  <TableCell>{feedback.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={feedback.priority}
                      color={getPriorityColor(feedback.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={feedback.status.replace('_', ' ')}
                      color={getStatusColor(feedback.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(feedback.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(feedback)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditOpen(feedback)}
                        color="info"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {feedback.status !== 'resolved' && feedback.status !== 'closed' && (
                      <Tooltip title="Mark as Resolved">
                        <IconButton
                          size="small"
                          onClick={() => handleQuickResolve(feedback.id)}
                          color="success"
                        >
                          <ResolveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {selectedFeedback && getTypeIcon(selectedFeedback.type)}
            <Typography variant="h6">Feedback Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFeedback && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Subject
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedFeedback.subject}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedFeedback.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip
                    icon={getTypeIcon(selectedFeedback.type)}
                    label={selectedFeedback.type.replace('_', ' ')}
                    color={getTypeColor(selectedFeedback.type)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={selectedFeedback.priority}
                    color={getPriorityColor(selectedFeedback.priority)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedFeedback.status.replace('_', ' ')}
                    color={getStatusColor(selectedFeedback.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body1">
                    {selectedFeedback.user_name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {selectedFeedback.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedFeedback.created_at)}
                  </Typography>
                </Grid>
                {selectedFeedback.admin_notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Admin Notes
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedFeedback.admin_notes}
                    </Typography>
                  </Grid>
                )}
                {selectedFeedback.resolved_at && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Resolved At
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedFeedback.resolved_at)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedFeedback && (
            <Button
              onClick={() => {
                setDetailsOpen(false);
                handleEditOpen(selectedFeedback);
              }}
              variant="contained"
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Feedback</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editStatus}
                label="Status"
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={editPriority}
                label="Priority"
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Admin Notes"
              multiline
              rows={4}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              fullWidth
              placeholder="Add internal notes about this feedback..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateFeedback} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackManagement;
