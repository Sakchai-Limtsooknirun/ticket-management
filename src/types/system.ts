export type UserRole = 'REQUESTER' | 'APPROVER' | 'ADMIN';
export type Department = 'PRODUCTION' | 'QUALITY' | 'MAINTENANCE' | 'ENGINEERING';
export type TicketStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: Department;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface ChemicalConfig {
  machineId: string;
  machineName: string;
  chemicalType: string;
  concentration: number;
  temperature: number;
  flowRate: number;
  additionalParams?: Record<string, any>;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: TicketStatus;
  department: string;
  requesterId: string;
  requester?: User;
  requestDate?: string;
  chemicalConfig?: any;
  attachments?: any[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'TICKET_SUBMITTED' | 'TICKET_APPROVED' | 'TICKET_REJECTED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ticketId: string;
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  entityType: 'TICKET' | 'USER' | 'CONFIG';
  entityId: string;
  userId: string;
  details: string;
  timestamp: string;
  ipAddress: string;
} 