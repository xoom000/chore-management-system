import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Box,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'reminder':
        return <WarningIcon />;
      case 'completion':
        return <CheckIcon />;
      case 'verification':
        return <VerifiedIcon />;
      default:
        return <InfoIcon />;
    }
  };
  
  const getNotificationColor = () => {
    switch (notification.type) {
      case 'reminder':
        return '#f57c00'; // orange
      case 'completion':
        return '#4caf50'; // green
      case 'verification':
        return '#2196f3'; // blue
      default:
        return '#9c27b0'; // purple
    }
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    const notificationDate = new Date(date);
    const now = new Date();
    
    // If notification is from today, show time only
    if (notificationDate.toDateString() === now.toDateString()) {
      return format(notificationDate, 'h:mm a');
    }
    
    // Otherwise show date and time
    return format(notificationDate, 'MMM d, h:mm a');
  };
  
  return (
    <>
      <ListItem 
        alignItems="flex-start"
        sx={{ 
          bgcolor: notification.isRead ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.08)'
          }
        }}
        secondaryAction={
          <Box>
            {!notification.isRead && (
              <IconButton 
                edge="end" 
                aria-label="mark as read"
                onClick={() => onMarkAsRead(notification._id)}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton 
              edge="end" 
              aria-label="delete" 
              onClick={() => onDelete(notification._id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: getNotificationColor() }}>
            {getNotificationIcon()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography
              variant="subtitle1"
              sx={{ 
                fontWeight: notification.isRead ? 'normal' : 'bold',
                pr: 8 // Make room for action buttons
              }}
            >
              {notification.title}
            </Typography>
          }
          secondary={
            <>
              <Typography
                variant="body2"
                color="text.primary"
                sx={{ 
                  display: 'block',
                  mb: 1,
                  pr: 8 // Make room for action buttons
                }}
              >
                {notification.message}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {formatDate(notification.createdAt)}
              </Typography>
            </>
          }
        />
      </ListItem>
      <Divider variant="inset" component="li" />
    </>
  );
};

export default NotificationItem;