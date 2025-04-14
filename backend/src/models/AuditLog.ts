import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction, EntityType } from '../types/system';

export interface IAuditLog extends Document {
  action: AuditAction;
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  previousValue?: any;
  newValue?: any;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogSchema = new Schema({
  action: {
    type: String,
    enum: [
      'CREATE', 
      'UPDATE', 
      'DELETE', 
      'STATUS_CHANGE', 
      'VIEW', 
      'LOGIN', 
      'LOGOUT', 
      'APPROVE', 
      'REJECT'
    ],
    required: true
  },
  entityType: {
    type: String,
    enum: [
      'TICKET', 
      'USER', 
      'CHEMICAL_CONFIG', 
      'ATTACHMENT', 
      'SYSTEM'
    ],
    required: true
  },
  entityId: {
    type: Schema.Types.Mixed,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  previousValue: {
    type: Schema.Types.Mixed
  },
  newValue: {
    type: Schema.Types.Mixed
  },
  details: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: false // We'll use our custom timestamp field
});

// Index for faster querying
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema); 