import { AuditLog, IAuditLog } from '../models/AuditLog';
import { AuditAction, EntityType, SystemTypes } from '../types/system';
import mongoose from 'mongoose';

interface AuditLogData {
  action: AuditAction;
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  userName: string;
  userRole: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for logging audit events in the system
 */
class AuditService {
  /**
   * Log a system activity
   * @param data The audit log data
   * @returns The created audit log entry
   */
  async logActivity(data: AuditLogData): Promise<IAuditLog | null> {
    try {
      // Handle case where data is missing critical fields
      if (!data || !data.action || !data.entityType || !data.entityId || !data.userId) {
        console.warn('Missing required fields for audit logging');
        return null;
      }
      
      // Validate that action and entityType are valid
      if (!SystemTypes.AuditAction.includes(data.action as any)) {
        console.warn(`Invalid audit action: ${data.action}`);
        return null;
      }
      
      if (!SystemTypes.EntityType.includes(data.entityType as any)) {
        console.warn(`Invalid entity type: ${data.entityType}`);
        return null;
      }

      const auditLog = new AuditLog({
        ...data,
        timestamp: new Date(),
        userId: new mongoose.Types.ObjectId(data.userId.toString())
      });
      
      return await auditLog.save();
    } catch (error) {
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
  async getEntityLogs(
    entityType: EntityType,
    entityId: string,
    limit: number = 100,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      if (!entityType || !entityId) {
        console.warn('Missing entityType or entityId for audit log query');
        return [];
      }
      
      if (!SystemTypes.EntityType.includes(entityType as any)) {
        console.warn(`Invalid entity type: ${entityType}`);
        return [];
      }
      
      return await AuditLog.find({ entityType, entityId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error fetching entity logs:', error);
      return [];
    }
  }

  /**
   * Get status change history for a ticket
   * @param ticketId The ID of the ticket
   * @returns Array of status change logs
   */
  async getTicketStatusHistory(ticketId: string): Promise<IAuditLog[]> {
    try {
      if (!ticketId) {
        console.warn('Missing ticketId for status history query');
        return [];
      }
      
      return await AuditLog.find({
        entityType: 'TICKET',
        entityId: ticketId,
        action: 'STATUS_CHANGE'
      })
      .sort({ timestamp: 1 }) // Ascending order for timeline
      .exec();
    } catch (error) {
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
  async getTicketStatusHistoryCount(
    ticketId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      if (!ticketId) {
        console.warn('Missing ticketId for status history count');
        return 0;
      }
      
      return await AuditLog.countDocuments({
        entityType: 'TICKET',
        entityId: ticketId,
        action: 'STATUS_CHANGE',
        timestamp: { $gte: startDate, $lte: endDate }
      });
    } catch (error) {
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
  async getTicketStatusHistoryWithDateRange(
    ticketId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      if (!ticketId) {
        console.warn('Missing ticketId for status history query');
        return [];
      }
      
      return await AuditLog.find({
        entityType: 'TICKET',
        entityId: ticketId,
        action: 'STATUS_CHANGE',
        timestamp: { $gte: startDate, $lte: endDate }
      })
      .sort({ timestamp: 1 }) // Ascending order for timeline
      .skip(skip)
      .limit(limit)
      .exec();
    } catch (error) {
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
  async getRecentActivity(limit: number = 50, skip: number = 0): Promise<IAuditLog[]> {
    try {
      return await AuditLog.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
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
  async getUserActivity(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IAuditLog[]> {
    try {
      if (!userId) {
        console.warn('Missing userId for user activity query');
        return [];
      }
      
      return await AuditLog.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }
}

export const auditService = new AuditService(); 