"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const AuditLog_1 = require("../models/AuditLog");
const system_1 = require("../types/system");
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Service for logging audit events in the system
 */
class AuditService {
    /**
     * Log a system activity
     * @param data The audit log data
     * @returns The created audit log entry
     */
    async logActivity(data) {
        try {
            // Handle case where data is missing critical fields
            if (!data || !data.action || !data.entityType || !data.entityId || !data.userId) {
                console.warn('Missing required fields for audit logging');
                return null;
            }
            // Validate that action and entityType are valid
            if (!system_1.SystemTypes.AuditAction.includes(data.action)) {
                console.warn(`Invalid audit action: ${data.action}`);
                return null;
            }
            if (!system_1.SystemTypes.EntityType.includes(data.entityType)) {
                console.warn(`Invalid entity type: ${data.entityType}`);
                return null;
            }
            const auditLog = new AuditLog_1.AuditLog({
                ...data,
                timestamp: new Date(),
                userId: new mongoose_1.default.Types.ObjectId(data.userId.toString())
            });
            return await auditLog.save();
        }
        catch (error) {
            console.error('Error logging audit activity:', error);
            // Return null but don't break the application flow
            return null;
        }
    }
    /**
     * Get audit logs for a specific entity
     * @param entityType The type of entity
     * @param entityId The ID of the entity
     * @param limit Maximum number of records to return
     * @param skip Number of records to skip (for pagination)
     * @returns Array of audit logs
     */
    async getEntityLogs(entityType, entityId, limit = 100, skip = 0) {
        try {
            if (!entityType || !entityId) {
                console.warn('Missing entityType or entityId for audit log query');
                return [];
            }
            if (!system_1.SystemTypes.EntityType.includes(entityType)) {
                console.warn(`Invalid entity type: ${entityType}`);
                return [];
            }
            return await AuditLog_1.AuditLog.find({ entityType, entityId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec();
        }
        catch (error) {
            console.error('Error fetching entity logs:', error);
            return [];
        }
    }
    /**
     * Get status change history for a ticket
     * @param ticketId The ID of the ticket
     * @returns Array of status change logs
     */
    async getTicketStatusHistory(ticketId) {
        try {
            if (!ticketId) {
                console.warn('Missing ticketId for status history query');
                return [];
            }
            return await AuditLog_1.AuditLog.find({
                entityType: 'TICKET',
                entityId: ticketId,
                action: 'STATUS_CHANGE'
            })
                .sort({ timestamp: 1 }) // Ascending order for timeline
                .exec();
        }
        catch (error) {
            console.error('Error fetching ticket status history:', error);
            return [];
        }
    }
    /**
     * Get status change history count for a ticket within a date range
     * @param ticketId The ID of the ticket
     * @param startDate Start date for filtering
     * @param endDate End date for filtering
     * @returns Count of status change records
     */
    async getTicketStatusHistoryCount(ticketId, startDate, endDate) {
        try {
            if (!ticketId) {
                console.warn('Missing ticketId for status history count');
                return 0;
            }
            return await AuditLog_1.AuditLog.countDocuments({
                entityType: 'TICKET',
                entityId: ticketId,
                action: 'STATUS_CHANGE',
                timestamp: { $gte: startDate, $lte: endDate }
            });
        }
        catch (error) {
            console.error('Error counting ticket status history:', error);
            return 0;
        }
    }
    /**
     * Get paginated status change history for a ticket with date filtering
     * @param ticketId The ID of the ticket
     * @param startDate Start date for filtering
     * @param endDate End date for filtering
     * @param limit Maximum number of records to return
     * @param skip Number of records to skip (for pagination)
     * @returns Array of status change logs
     */
    async getTicketStatusHistoryWithDateRange(ticketId, startDate, endDate, limit = 20, skip = 0) {
        try {
            if (!ticketId) {
                console.warn('Missing ticketId for status history query');
                return [];
            }
            return await AuditLog_1.AuditLog.find({
                entityType: 'TICKET',
                entityId: ticketId,
                action: 'STATUS_CHANGE',
                timestamp: { $gte: startDate, $lte: endDate }
            })
                .sort({ timestamp: 1 }) // Ascending order for timeline
                .skip(skip)
                .limit(limit)
                .exec();
        }
        catch (error) {
            console.error('Error fetching ticket status history with date range:', error);
            return [];
        }
    }
    /**
     * Get recent activity for the system
     * @param limit Maximum number of records to return
     * @param skip Number of records to skip (for pagination)
     * @returns Array of recent audit logs
     */
    async getRecentActivity(limit = 50, skip = 0) {
        try {
            return await AuditLog_1.AuditLog.find()
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec();
        }
        catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    }
    /**
     * Get activity by a specific user
     * @param userId The ID of the user
     * @param limit Maximum number of records to return
     * @param skip Number of records to skip (for pagination)
     * @returns Array of audit logs for the user
     */
    async getUserActivity(userId, limit = 50, skip = 0) {
        try {
            if (!userId) {
                console.warn('Missing userId for user activity query');
                return [];
            }
            return await AuditLog_1.AuditLog.find({ userId: new mongoose_1.default.Types.ObjectId(userId) })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec();
        }
        catch (error) {
            console.error('Error fetching user activity:', error);
            return [];
        }
    }
}
exports.auditService = new AuditService();
