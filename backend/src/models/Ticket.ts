import mongoose, { Schema, Document } from 'mongoose';
import { TicketStatus, Department } from '../types/system';

export interface ITicket extends Document {
  title: string;
  description: string;
  chemicalConfig: {
    [key: string]: any;
  };
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  status: TicketStatus;
  requesterId: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  department: Department;
  requestDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  chemicalConfig: {
    type: Schema.Types.Mixed,
    required: true,
  },
  attachments: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: String,
    uploadedAt: String
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'DRAFT',
  },
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: String,
    enum: ['PRODUCTION', 'QUALITY', 'MAINTENANCE', 'ENGINEERING'],
    required: true,
  },
  requestDate: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema); 