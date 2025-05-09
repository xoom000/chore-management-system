import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Verified as VerifiedIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const ChoreCard = ({ chore, onComplete, onDelete, onVerify }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isParent = user?.role === 'parent';
  const isAssignedToMe = user?.id === chore.assignedTo._id;
  
  const getStatusColor = () => {
    switch (chore.status) {
      case 'completed':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'info';
    }
  };
  
  const formatDueDate = (date) => {
    if (!date) return 'No due date';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };
  
  const handleClick = () => {
    navigate(`/chores/${chore._id}`);
  };
  
  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            {chore.title}
          </Typography>
          <Chip 
            label={chore.status.charAt(0).toUpperCase() + chore.status.slice(1)} 
            color={getStatusColor()}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {chore.description}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            Due: {formatDueDate(chore.dueDate)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Assigned to: {chore.assignedTo.name}
          </Typography>
        </Box>
        
        {chore.recurring && (
          <Chip 
            label={`Recurring: ${chore.recurrencePattern}`} 
            size="small" 
            sx={{ mt: 1 }}
          />
        )}
        
        {chore.status === 'completed' && chore.requiresVerification && !chore.verifiedBy && (
          <Chip 
            label="Needs Verification" 
            color="warning" 
            size="small" 
            sx={{ mt: 1, ml: 1 }}
          />
        )}
        
        {chore.verifiedBy && (
          <Tooltip title={`Verified by ${chore.verifiedBy.name}`}>
            <Chip 
              icon={<VerifiedIcon />}
              label="Verified" 
              color="success" 
              size="small" 
              sx={{ mt: 1, ml: 1 }}
            />
          </Tooltip>
        )}
      </CardContent>
      
      <CardActions>
        <Button size="small" color="primary" onClick={handleClick}>
          View Details
        </Button>
        
        {isAssignedToMe && chore.status === 'pending' && (
          <Button 
            size="small" 
            color="success" 
            startIcon={<CheckIcon />}
            onClick={() => onComplete(chore._id)}
          >
            Mark Complete
          </Button>
        )}
        
        {isParent && chore.status === 'completed' && chore.requiresVerification && !chore.verifiedBy && (
          <Button 
            size="small" 
            color="warning" 
            startIcon={<VerifiedIcon />}
            onClick={() => onVerify(chore._id, true)}
          >
            Verify
          </Button>
        )}
        
        {isParent && (
          <Box sx={{ ml: 'auto' }}>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => navigate(`/chores/${chore._id}/edit`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="error"
              onClick={() => onDelete(chore._id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </CardActions>
    </Card>
  );
};

export default ChoreCard;