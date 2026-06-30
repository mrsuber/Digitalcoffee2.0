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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { coachAPI } from '../services/api';

const CoachVideoSessions = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add availability dialog
  const [openAddAvailability, setOpenAddAvailability] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
  });

  // Block slot dialog
  const [openBlockSlot, setOpenBlockSlot] = useState(false);
  const [newBlock, setNewBlock] = useState({
    blockedDate: '',
    startTime: '09:00',
    endTime: '17:00',
    reason: '',
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        // Load bookings
        const response = await coachAPI.getVideoBookings();
        setBookings(response.data?.bookings || []);
      } else if (activeTab === 1) {
        // Load availability
        const response = await coachAPI.getMyAvailability();
        setAvailability(response.data?.weeklyAvailability || []);
        setBlockedSlots(response.data?.blockedSlots || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    try {
      await coachAPI.setAvailability(
        newAvailability.dayOfWeek,
        newAvailability.startTime,
        newAvailability.endTime
      );
      setOpenAddAvailability(false);
      setNewAvailability({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
      loadData();
    } catch (error) {
      console.error('Error adding availability:', error);
      alert('Failed to add availability: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteAvailability = async (id) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        await coachAPI.deleteAvailability(id);
        loadData();
      } catch (error) {
        console.error('Error deleting availability:', error);
        alert('Failed to delete availability');
      }
    }
  };

  const handleBlockSlot = async () => {
    try {
      await coachAPI.blockSlot(
        newBlock.blockedDate,
        newBlock.startTime,
        newBlock.endTime,
        newBlock.reason
      );
      setOpenBlockSlot(false);
      setNewBlock({ blockedDate: '', startTime: '09:00', endTime: '17:00', reason: '' });
      loadData();
    } catch (error) {
      console.error('Error blocking slot:', error);
      alert('Failed to block slot: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUnblockSlot = async (id) => {
    if (window.confirm('Are you sure you want to unblock this date/time?')) {
      try {
        await coachAPI.unblockSlot(id);
        loadData();
      } catch (error) {
        console.error('Error unblocking slot:', error);
        alert('Failed to unblock slot');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'primary',
      in_progress: 'success',
      completed: 'default',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getTimeUntilSession = (scheduledAt) => {
    const scheduled = new Date(scheduledAt);
    const now = new Date();
    const diff = scheduled - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'Past due';
    if (hours < 1) return `${minutes} minutes`;
    if (hours < 24) return `${hours}h ${minutes}m`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const canJoinSession = (booking) => {
    if (booking.status !== 'scheduled') return false;
    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const minutesUntil = (scheduledTime - now) / (1000 * 60);
    return minutesUntil <= 5 && minutesUntil >= -10;
  };

  const renderBookings = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">My Video Sessions</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time Until</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No video sessions scheduled
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
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
                    <Typography variant="body2" color={
                      canJoinSession(booking) ? 'success.main' : 'text.secondary'
                    }>
                      {getTimeUntilSession(booking.scheduled_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={booking.booking_notes || 'No notes'}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {booking.booking_notes || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {canJoinSession(booking) && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<VideoCallIcon />}
                        href={`/coach/video-call/${booking.id}`}
                      >
                        Join
                      </Button>
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

  const renderAvailability = () => (
    <Box>
      <Grid container spacing={3}>
        {/* Weekly Availability */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Weekly Availability
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddAvailability(true)}
                >
                  Add Hours
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availability.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No availability set
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      availability.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>{daysOfWeek[slot.day_of_week]}</TableCell>
                          <TableCell>
                            {slot.start_time} - {slot.end_time}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAvailability(slot.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Blocked Dates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <BlockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Blocked Dates
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenBlockSlot(true)}
                >
                  Block Date
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {blockedSlots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No blocked dates
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      blockedSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell>
                            {format(parseISO(slot.blocked_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {slot.start_time} - {slot.end_time}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {slot.reason || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => handleUnblockSlot(slot.id)}
                            >
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <VideoCallIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Video Sessions
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="My Sessions" />
          <Tab label="Availability & Schedule" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderBookings()}
          {activeTab === 1 && renderAvailability()}
        </Box>
      </Paper>

      {/* Add Availability Dialog */}
      <Dialog open={openAddAvailability} onClose={() => setOpenAddAvailability(false)}>
        <DialogTitle>Add Weekly Availability</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 400 }}>
            <TextField
              select
              fullWidth
              label="Day of Week"
              value={newAvailability.dayOfWeek}
              onChange={(e) => setNewAvailability({ ...newAvailability, dayOfWeek: parseInt(e.target.value) })}
              margin="normal"
              SelectProps={{ native: true }}
            >
              {daysOfWeek.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Start Time (HH:MM)"
              value={newAvailability.startTime}
              onChange={(e) => setNewAvailability({ ...newAvailability, startTime: e.target.value })}
              margin="normal"
              placeholder="09:00"
            />

            <TextField
              fullWidth
              label="End Time (HH:MM)"
              value={newAvailability.endTime}
              onChange={(e) => setNewAvailability({ ...newAvailability, endTime: e.target.value })}
              margin="normal"
              placeholder="17:00"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddAvailability(false)}>Cancel</Button>
          <Button onClick={handleAddAvailability} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Block Slot Dialog */}
      <Dialog open={openBlockSlot} onClose={() => setOpenBlockSlot(false)}>
        <DialogTitle>Block Date/Time</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, minWidth: 400 }}>
            <TextField
              fullWidth
              type="date"
              label="Date to Block"
              value={newBlock.blockedDate}
              onChange={(e) => setNewBlock({ ...newBlock, blockedDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Start Time (HH:MM)"
              value={newBlock.startTime}
              onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
              margin="normal"
              placeholder="09:00"
            />

            <TextField
              fullWidth
              label="End Time (HH:MM)"
              value={newBlock.endTime}
              onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
              margin="normal"
              placeholder="17:00"
            />

            <TextField
              fullWidth
              label="Reason (Optional)"
              value={newBlock.reason}
              onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
              margin="normal"
              multiline
              rows={2}
              placeholder="e.g., Vacation, Personal appointment"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBlockSlot(false)}>Cancel</Button>
          <Button onClick={handleBlockSlot} variant="contained">Block</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoachVideoSessions;
