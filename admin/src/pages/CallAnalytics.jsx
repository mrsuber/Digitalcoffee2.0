import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';

const CallAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    overview: {
      totalSessions: 0,
      totalMinutes: 0,
      averageQuality: 0,
      completionRate: 0,
    },
    byCoach: [],
    qualityMetrics: {
      excellent: 0, // 80-100
      good: 0, // 60-79
      fair: 0, // 40-59
      poor: 0, // 0-39
    },
    peakHours: [],
    recentSessions: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getVideoCallAnalytics(timeRange);
      const data = response.data;

      // Process the data
      setAnalytics({
        overview: {
          totalSessions: data.totalSessions || 0,
          totalMinutes: data.totalMinutes || 0,
          averageQuality: data.averageQuality || 0,
          completionRate: data.completionRate || 0,
        },
        byCoach: data.byCoach || [],
        qualityMetrics: data.qualityMetrics || {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
        },
        peakHours: data.peakHours || [],
        recentSessions: data.recentSessions || [],
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Use mock data for now
      setAnalytics({
        overview: {
          totalSessions: 0,
          totalMinutes: 0,
          averageQuality: 0,
          completionRate: 0,
        },
        byCoach: [],
        qualityMetrics: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
        },
        peakHours: [],
        recentSessions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const getQualityLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const renderOverviewCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, fontSize: '0.9rem' }}>
                  Total Sessions
                </Typography>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                  {analytics.overview.totalSessions}
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                  Last {timeRange} days
                </Typography>
              </Box>
              <VideoCallIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, fontSize: '0.9rem' }}>
                  Total Minutes
                </Typography>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                  {analytics.overview.totalMinutes.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                  {(analytics.overview.totalMinutes / 60).toFixed(1)} hours
                </Typography>
              </Box>
              <AccessTimeIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, fontSize: '0.9rem' }}>
                  Avg Quality
                </Typography>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                  {analytics.overview.averageQuality.toFixed(1)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                  {getQualityLabel(analytics.overview.averageQuality)}
                </Typography>
              </Box>
              <StarIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', opacity: 0.9, fontSize: '0.9rem' }}>
                  Completion Rate
                </Typography>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
                  {analytics.overview.completionRate.toFixed(0)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
                  Successful sessions
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 48, color: 'white', opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderCoachPerformance = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Coach Performance
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Coach</TableCell>
                  <TableCell align="center">Sessions</TableCell>
                  <TableCell align="center">Total Minutes</TableCell>
                  <TableCell align="center">Avg Quality</TableCell>
                  <TableCell align="center">Completion %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.byCoach.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.byCoach.map((coach, index) => (
                    <TableRow key={index}>
                      <TableCell>{coach.name}</TableCell>
                      <TableCell align="center">{coach.sessions}</TableCell>
                      <TableCell align="center">{coach.totalMinutes}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={coach.avgQuality.toFixed(1)}
                          color={getQualityColor(coach.avgQuality)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">{coach.completionRate.toFixed(0)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quality Distribution
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Excellent (80-100)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analytics.qualityMetrics.excellent}
                </Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(analytics.qualityMetrics.excellent / analytics.overview.totalSessions) * 100}%`,
                    bgcolor: 'success.main',
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Good (60-79)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analytics.qualityMetrics.good}
                </Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(analytics.qualityMetrics.good / analytics.overview.totalSessions) * 100}%`,
                    bgcolor: 'primary.main',
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Fair (40-59)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analytics.qualityMetrics.fair}
                </Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(analytics.qualityMetrics.fair / analytics.overview.totalSessions) * 100}%`,
                    bgcolor: 'warning.main',
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Poor (0-39)</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analytics.qualityMetrics.poor}
                </Typography>
              </Box>
              <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(analytics.qualityMetrics.poor / analytics.overview.totalSessions) * 100}%`,
                    bgcolor: 'error.main',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPeakHours = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Peak Usage Hours
      </Typography>
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {[...Array(24)].map((_, hour) => {
          const count = analytics.peakHours.find(h => h.hour === hour)?.count || 0;
          const maxCount = Math.max(...analytics.peakHours.map(h => h.count || 0), 1);
          const height = (count / maxCount) * 100;

          return (
            <Grid item xs={1} key={hour}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 100,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  <Tooltip title={`${count} sessions at ${hour}:00`}>
                    <Box
                      sx={{
                        width: '80%',
                        height: `${height}%`,
                        bgcolor: height > 70 ? 'primary.main' : height > 40 ? 'primary.light' : 'grey.300',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      }}
                    />
                  </Tooltip>
                </Box>
                <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                  {hour}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        Hours are displayed in 24-hour format (0-23). Darker bars indicate peak usage times.
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Video Call Analytics
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Typography>Loading analytics...</Typography>
      ) : (
        <>
          {renderOverviewCards()}
          {renderCoachPerformance()}
          {renderPeakHours()}
        </>
      )}
    </Box>
  );
};

// Simple Tooltip component
const Tooltip = ({ title, children }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        height: '100%',
        '&:hover .tooltip-text': {
          visibility: 'visible',
          opacity: 1,
        },
      }}
    >
      {children}
      <Box
        className="tooltip-text"
        sx={{
          visibility: 'hidden',
          opacity: 0,
          bgcolor: 'grey.800',
          color: 'white',
          textAlign: 'center',
          borderRadius: 1,
          padding: '4px 8px',
          position: 'absolute',
          zIndex: 1,
          bottom: '125%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.3s',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '100%',
            left: '50%',
            marginLeft: '-5px',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: 'grey.800 transparent transparent transparent',
          },
        }}
      >
        <Typography variant="caption">{title}</Typography>
      </Box>
    </Box>
  );
};

export default CallAnalytics;
