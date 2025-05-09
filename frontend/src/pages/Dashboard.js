import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import choreService from '../services/choreService';
import notificationService from '../services/notificationService';
import routerService from '../services/routerService';
import ChoreCard from '../components/ChoreCard';
import NotificationItem from '../components/NotificationItem';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [choreStats, setChoreStats] = useState({
    pending: 0,
    completed: 0,
    overdue: 0
  });
  const [recentChores, setRecentChores] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [internetStatus, setInternetStatus] = useState(false);
  
  const isParent = user?.role === 'parent';
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch chores
        const chores = await choreService.getAllChores();
        
        // Calculate stats
        const stats = {
          pending: chores.filter(c => c.status === 'pending').length,
          completed: chores.filter(c => c.status === 'completed').length,
          overdue: chores.filter(c => c.status === 'overdue').length
        };
        setChoreStats(stats);
        
        // Sort chores by due date (recent ones first)
        const sortedChores = [...chores].sort((a, b) => 
          new Date(a.dueDate) - new Date(b.dueDate)
        );
        
        // Get most recent chores (up to 3)
        setRecentChores(sortedChores.slice(0, 3));
        
        // Fetch notifications
        const notifications = await notificationService.getUserNotifications();
        
        // Sort notifications by created date (recent ones first)
        const sortedNotifications = [...notifications].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Get most recent notifications (up to 5)
        setRecentNotifications(sortedNotifications.slice(0, 5));
        
        // Check internet status
        const status = await routerService.getMyInternetStatus();
        setInternetStatus(status.internetAccess);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
        console.error(err);
      }
    };
    
    loadDashboardData();
  }, []);
  
  const handleCompleteChore = async (choreId) => {
    try {
      await choreService.completeChore(choreId);
      
      // Refresh the chores list
      const chores = await choreService.getAllChores();
      const sortedChores = [...chores].sort((a, b) => 
        new Date(a.dueDate) - new Date(b.dueDate)
      );
      setRecentChores(sortedChores.slice(0, 3));
      
      // Update stats
      const stats = {
        pending: chores.filter(c => c.status === 'pending').length,
        completed: chores.filter(c => c.status === 'completed').length,
        overdue: chores.filter(c => c.status === 'overdue').length
      };
      setChoreStats(stats);
      
      // Check if internet status changed
      const status = await routerService.getMyInternetStatus();
      setInternetStatus(status.internetAccess);
    } catch (err) {
      console.error(err);
      setError('Failed to complete chore');
    }
  };
  
  const handleVerifyChore = async (choreId, approved) => {
    try {
      await choreService.verifyChore(choreId, approved);
      
      // Refresh the chores list
      const chores = await choreService.getAllChores();
      const sortedChores = [...chores].sort((a, b) => 
        new Date(a.dueDate) - new Date(b.dueDate)
      );
      setRecentChores(sortedChores.slice(0, 3));
      
      // Update stats
      const stats = {
        pending: chores.filter(c => c.status === 'pending').length,
        completed: chores.filter(c => c.status === 'completed').length,
        overdue: chores.filter(c => c.status === 'overdue').length
      };
      setChoreStats(stats);
    } catch (err) {
      console.error(err);
      setError('Failed to verify chore');
    }
  };
  
  const handleDeleteChore = async (choreId) => {
    try {
      await choreService.deleteChore(choreId);
      
      // Remove the chore from the list
      setRecentChores(recentChores.filter(c => c._id !== choreId));
      
      // Update stats
      const chores = await choreService.getAllChores();
      const stats = {
        pending: chores.filter(c => c.status === 'pending').length,
        completed: chores.filter(c => c.status === 'completed').length,
        overdue: chores.filter(c => c.status === 'overdue').length
      };
      setChoreStats(stats);
    } catch (err) {
      console.error(err);
      setError('Failed to delete chore');
    }
  };
  
  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update notifications in the state
      setRecentNotifications(recentNotifications.map(notification => 
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ));
    } catch (err) {
      console.error(err);
      setError('Failed to mark notification as read');
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Remove the notification from the list
      setRecentNotifications(recentNotifications.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error(err);
      setError('Failed to delete notification');
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Welcome, {user?.name}
        </Typography>
        
        <Box>
          {internetStatus ? (
            <Chip 
              icon={<WifiIcon />} 
              label="Internet Access: Enabled" 
              color="success" 
              variant="outlined"
            />
          ) : (
            <Chip 
              icon={<WifiOffIcon />} 
              label="Internet Access: Disabled" 
              color="error" 
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Chore Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chore Statistics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Pending:</Typography>
                <Chip 
                  label={choreStats.pending} 
                  color="info" 
                  size="small" 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Completed:</Typography>
                <Chip 
                  label={choreStats.completed} 
                  color="success" 
                  size="small" 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Overdue:</Typography>
                <Chip 
                  label={choreStats.overdue} 
                  color="error" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button 
                  variant="contained" 
                  startIcon={<CheckIcon />}
                  onClick={() => navigate('/chores')}
                >
                  View My Chores
                </Button>
                
                {isParent && (
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-chore')}
                  >
                    Add New Chore
                  </Button>
                )}
                
                {isParent && (
                  <Button 
                    variant="contained" 
                    color="warning" 
                    startIcon={<WifiIcon />}
                    onClick={() => navigate('/internet-control')}
                  >
                    Manage Internet Access
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Chores */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Chores
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/chores')}
              >
                View All
              </Button>
            </Box>
            
            {recentChores.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No chores available
              </Typography>
            ) : (
              recentChores.map(chore => (
                <ChoreCard 
                  key={chore._id} 
                  chore={chore} 
                  onComplete={handleCompleteChore}
                  onDelete={handleDeleteChore}
                  onVerify={handleVerifyChore}
                />
              ))
            )}
          </Paper>
        </Grid>
        
        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Notifications
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/notifications')}
              >
                View All
              </Button>
            </Box>
            
            {recentNotifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No notifications available
              </Typography>
            ) : (
              <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                {recentNotifications.map(notification => (
                  <NotificationItem 
                    key={notification._id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkNotificationAsRead}
                    onDelete={handleDeleteNotification}
                  />
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;