"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const auditService_1 = require("../services/auditService");
const router = express_1.default.Router();
// Get status history for a specific ticket (accessible by ticket owners, approvers, and admins)
router.get('/tickets/:id/status-history', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        const ticketId = req.params.id;
        // TODO: Add permission check to ensure user has access to this ticket
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Date filtering - default to last 30 days if not specified
        const endDate = new Date(req.query.endDate || new Date());
        const startDate = new Date(req.query.startDate || new Date());
        if (!req.query.startDate) {
            startDate.setDate(startDate.getDate() - 30); // Default 30 days back
        }
        // Get total count for pagination
        const total = await auditService_1.auditService.getTicketStatusHistoryCount(ticketId, startDate, endDate);
        // Get paginated status history with date range
        const statusHistory = await auditService_1.auditService.getTicketStatusHistoryWithDateRange(ticketId, startDate, endDate, limit, skip);
        // Format the response for the frontend
        const formattedHistory = statusHistory.map(log => {
            var _a, _b;
            return ({
                id: log._id,
                ticketId: log.entityId,
                previousStatus: ((_a = log.previousValue) === null || _a === void 0 ? void 0 : _a.status) || '',
                newStatus: ((_b = log.newValue) === null || _b === void 0 ? void 0 : _b.status) || '',
                changedBy: {
                    _id: log.userId,
                    fullName: log.userName,
                    role: log.userRole
                },
                changedAt: log.timestamp,
                comments: log.details
            });
        });
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
    }
    catch (error) {
        console.error('Error fetching ticket status history:', error);
        res.status(500).json({ message: 'Error fetching ticket status history', error });
    }
});
// Get all audit logs for a specific ticket (admin only)
router.get('/tickets/:id/logs', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        // Only admins can see the full audit trail
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to view complete audit logs' });
        }
        const ticketId = req.params.id;
        const limit = parseInt(req.query.limit) || 100;
        const skip = parseInt(req.query.skip) || 0;
        const logs = await auditService_1.auditService.getEntityLogs('TICKET', ticketId, limit, skip);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching ticket audit logs:', error);
        res.status(500).json({ message: 'Error fetching ticket audit logs', error });
    }
});
// Get recent system activity (admin only)
router.get('/recent', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        // Only admins can see system-wide activity
        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to view system activity' });
        }
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        const logs = await auditService_1.auditService.getRecentActivity(limit, skip);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Error fetching recent activity', error });
    }
});
// Get user activity (admin can see any user, others can only see their own)
router.get('/users/:userId', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        const targetUserId = req.params.userId;
        // Users can only see their own activity unless they're an admin
        if (user.role !== 'ADMIN' && user.id !== targetUserId) {
            return res.status(403).json({ message: 'Not authorized to view other user activities' });
        }
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;
        const logs = await auditService_1.auditService.getUserActivity(targetUserId, limit, skip);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Error fetching user activity', error });
    }
});
exports.default = router;
