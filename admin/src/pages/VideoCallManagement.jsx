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
  Tab,
  Tabs,
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
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { adminAPI } from '../services/api';

const VideoCallManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    scheduledBookings: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        // Load all bookings
        const response = await adminAPI.getVideoCallBookings();
        setBookings(response.data?.bookings || []);
        calculateStats(response.data?.bookings || []);
      } else if (activeTab === 1) {
        // Load sessions (completed/active)
        const response = await adminAPI.getVideoCallSessions();
        setSessions(response.data?.sessions || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const scheduled = bookingsData.filter(b => b.status === 'scheduled').length;
    const active = bookingsData.filter(b => b.status === 'in_progress').length;
    const completed = bookingsData.filter(b => b.status === 'completed').length;

    setStats({
      totalSessions: bookingsData.length,
      activeSessions: active,
      completedSessions: completed,
      scheduledBookings: scheduled,
    });
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setOpenDetailsDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'primary',
      in_progress: 'success',
      completed: 'default',
      cancelled: 'error',
      waiting: 'warning',
    };
    return colors[status] || 'default';
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.coach_name?.toLowerCase().includes(query) ||
      booking.student_name?.toLowerCase().includes(query) ||
      booking.status?.toLowerCase().includes(query)
    );
  });

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.coach_name?.toLowerCase().includes(query) ||
      session.student_name?.toLowerCase().includes(query) ||
      session.session_token?.toLowerCase().includes(query)
    );
  });

  const renderStats = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Bookings
            </Typography>
            <Typography variant="h4">{stats.totalSessions}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Scheduled
            </Typography>
            <Typography variant="h4" color="primary">
              {stats.scheduledBookings}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Now
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.activeSessions}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Completed
            </Typography>
            <Typography variant="h4">{stats.completedSessions}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBookings = () => (
    <Box>
      {renderStats()}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Search by coach, student, or status..."
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Scheduled Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Booked At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No bookings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.id}</TableCell>
                  <TableCell>{booking.coach_name}</TableCell>
                  <TableCell>{booking.student_name}</TableCell>
                  <TableCell>
                    {format(parseISO(booking.scheduled_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{booking.duration_minutes || 30} min</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(parseISO(booking.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderSessions = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          placeholder="Search by coach, student, or session token..."
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Session ID</TableCell>
              <TableCell>Booking ID</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Started At</TableCell>
              <TableCell>Ended At</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Quality Score</TableCell>
              <TableCell>Recording</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No sessions found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{session.booking_id}</TableCell>
                  <TableCell>{session.coach_name}</TableCell>
                  <TableCell>{session.student_name}</TableCell>
                  <TableCell>
                    {session.started_at
                      ? format(parseISO(session.started_at), 'MMM dd, HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {session.ended_at
                      ? format(parseISO(session.ended_at), 'MMM dd, HH:mm')
                      : 'In Progress'}
                  </TableCell>
                  <TableCell>
                    {session.actual_duration_minutes || '-'} min
                  </TableCell>
                  <TableCell>
                    {session.quality_score ? `${session.quality_score}/100` : '-'}
                  </TableCell>
                  <TableCell>
                    {session.recording_url ? (
                      <Tooltip title="View Recording">
                        <IconButton size="small" color="primary">
                          <PlayIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <VideoCallIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Video Call Management
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="All Bookings" />
          <Tab label="Sessions" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <>
              {activeTab === 0 && renderBookings()}
              {activeTab === 1 && renderSessions()}
            </>
          )}
        </Box>
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Booking ID
                  </Typography>
                  <Typography variant="body1">{selectedSession.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedSession.status}
                    color={getStatusColor(selectedSession.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Coach
                  </Typography>
                  <Typography variant="body1">{selectedSession.coach_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Student
                  </Typography>
                  <Typography variant="body1">{selectedSession.student_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Scheduled Time
                  </Typography>
                  <Typography variant="body1">
                    {format(parseISO(selectedSession.scheduled_at), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {selectedSession.duration_minutes || 30} minutes
                  </Typography>
                </Grid>
                {selectedSession.booking_notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedSession.booking_notes}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {format(parseISO(selectedSession.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoCallManagement;
