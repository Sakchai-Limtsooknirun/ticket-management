import express, { Request, Response } from 'express';
import { auth as authenticateToken } from '../middleware/auth';
import { auditService } from '../services/auditService';

const router = express.Router();

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

// Get status history for a specific ticket (accessible by ticket owners, approvers, and admins)
router.get('/tickets/:id/status-history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const ticketId = req.params.id;
    
    // TODO: Add permission check to ensure user has access to this ticket
    
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    // Date filtering - default to last 30 days if not specified
    const endDate = new Date(req.query.endDate as string || new Date());
    const startDate = new Date(req.query.startDate as string || new Date());
    if (!req.query.startDate) {
      startDate.setDate(startDate.getDate() - 30); // Default 30 days back
    }
    
    // Get total count for pagination
    const total = await auditService.getTicketStatusHistoryCount(ticketId, startDate, endDate);
    
    // Get paginated status history with date range
    const statusHistory = await auditService.getTicketStatusHistoryWithDateRange(
      ticketId, 
      startDate, 
      endDate, 
      limit, 
      skip
    );
    
    // Format the response for the frontend
    const formattedHistory = statusHistory.map(log => ({
      id: log._id,
      ticketId: log.entityId,
      previousStatus: log.previousValue?.status || '',
      newStatus: log.newValue?.status || '',
      changedBy: {
        _id: log.userId,
        fullName: log.userName,
        role: log.userRole
      },
      changedAt: log.timestamp,
      comments: log.details
    }));
    
    res.json({
      statusHistory: formattedHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching ticket status history:', error);
    res.status(500).json({ message: 'Error fetching ticket status history', error });
  }
});

// Get all audit logs for a specific ticket (admin only)
router.get('/tickets/:id/logs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    // Only admins can see the full audit trail
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view complete audit logs' });
    }
    
    const ticketId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const logs = await auditService.getEntityLogs('TICKET', ticketId, limit, skip);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching ticket audit logs:', error);
    res.status(500).json({ message: 'Error fetching ticket audit logs', error });
  }
});

// Get recent system activity (admin only)
router.get('/recent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    // Only admins can see system-wide activity
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view system activity' });
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const logs = await auditService.getRecentActivity(limit, skip);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity', error });
  }
});

// Get user activity (admin can see any user, others can only see their own)
router.get('/users/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const targetUserId = req.params.userId;
    
    // Users can only see their own activity unless they're an admin
    if (user.role !== 'ADMIN' && user.id !== targetUserId) {
      return res.status(403).json({ message: 'Not authorized to view other user activities' });
    }
    
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const logs = await auditService.getUserActivity(targetUserId, limit, skip);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Error fetching user activity', error });
  }
});

export default router; 