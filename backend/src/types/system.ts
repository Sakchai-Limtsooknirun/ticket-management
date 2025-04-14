// User and ticket related types
export type UserRole = 'REQUESTER' | 'APPROVER' | 'ADMIN';
export type Department = 'PRODUCTION' | 'QUALITY' | 'MAINTENANCE' | 'ENGINEERING';
export type TicketStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

// Explicitly export audit log action types 
export type AuditAction = 
  'CREATE' | 
  'UPDATE' | 
  'DELETE' | 
  'STATUS_CHANGE' | 
  'VIEW' | 
  'LOGIN' | 
  'LOGOUT' | 
  'APPROVE' | 
  'REJECT';

// Explicitly export entity types for audit logs
export type EntityType = 
  'TICKET' | 
  'USER' | 
  'CHEMICAL_CONFIG' | 
  'ATTACHMENT' | 
  'SYSTEM';

// Chemical configuration
export interface ChemicalConfig {
  machineId: string;
  machineName: string;
  chemicalType: string;
  concentration: number;
  temperature: number;
  flowRate: number;
  additionalParams?: Record<string, any>;
}

// File attachment
export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

// Comment on tickets
export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

// Export all types in a namespace as well for compatibility
export const SystemTypes = {
  UserRole: ['REQUESTER', 'APPROVER', 'ADMIN'] as UserRole[],
  Department: ['PRODUCTION', 'QUALITY', 'MAINTENANCE', 'ENGINEERING'] as Department[],
  TicketStatus: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'] as TicketStatus[],
  AuditAction: [
    'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 
    'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'
  ] as AuditAction[],
  EntityType: [
    'TICKET', 'USER', 'CHEMICAL_CONFIG', 'ATTACHMENT', 'SYSTEM'
  ] as EntityType[]
}; 