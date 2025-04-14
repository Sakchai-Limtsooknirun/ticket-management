import express, { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { auth as authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User';
import { auditService } from '../services/auditService';
import { getRequestIP, getUserAgent, isForwardMovement, sanitizeObject } from '../utils';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

// Create a new ticket
router.post('/', authenticateToken, upload.array('files'), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, description, chemicalConfig } = req.body;
    const files = req.files as Express.Multer.File[];
    
    // Get the requester's full information
    const requester = await User.findById(user.id);
    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    const attachments = files?.map(file => ({
      id: file.filename,
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString()
    })) || [];

    const ticket = new Ticket({
      title,
      description,
      chemicalConfig: JSON.parse(chemicalConfig),
      attachments,
      requesterId: user.id,
      requester: requester,
      department: requester.department,
      status: 'DRAFT',
      requestDate: new Date().toISOString()
    });

    await ticket.save();
    
    // Populate the requester information
    await ticket.populate('requester');
    
    // Log ticket creation
    await auditService.logActivity({
      action: 'CREATE',
      entityType: 'TICKET',
      entityId: ticket._id,
      userId: user.id,
      userName: requester.fullName,
      userRole: user.role,
      newValue: sanitizeObject(ticket.toObject()),
      details: 'Ticket created',
      ipAddress: getRequestIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket', error });
  }
});

// Get all tickets
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

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
    
    // Log the request details
    console.log('\n📝 GET /tickets Request:');
    console.log(JSON.stringify({
      user: {
        id: user.id,
        role: user.role
      },
      query: req.query,
      pagination: { page, limit, skip },
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }, null, 2));
    
    // Build the query
    let query: any = {
      requestDate: { $gte: startDate.toISOString(), $lte: endDate.toISOString() }
    };
    
    // Apply role-based filtering:
    // - ADMIN can see all tickets
    // - APPROVER can see all PENDING tickets plus their own tickets
    // - REQUESTER can only see their own tickets
    if (user.role === 'REQUESTER') {
      // Requesters can only see their own tickets
      query.requesterId = user.id;
    } else if (user.role === 'APPROVER') {
      // Approvers can see all PENDING tickets plus their own tickets
      query = { 
        ...query,
        $or: [
          { status: 'PENDING' },
          { status: 'APPROVED' },
          { status: 'REJECTED' },
          { requesterId: user.id }
        ]
      };
    }
    // Admins can see all tickets (just date filter applied)

    // Log the final MongoDB query
    console.log('\n🔎 MongoDB Query:');
    console.log(JSON.stringify(query, null, 2));

    // Get total count for pagination info
    const total = await Ticket.countDocuments(query);
    console.log(`\n📊 Total matching tickets: ${total}`);
    
    // Execute query with pagination
    const tickets = await Ticket.find(query)
      .populate('requester')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`\n✅ Retrieved ${tickets.length} tickets`);
    
    // Send response with pagination metadata
    res.json({
      tickets,
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
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error });
  }
});

// Get a specific ticket
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('requester');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket', error });
  }
});

// Update a ticket
router.put('/:id', authenticateToken, upload.array('files'), async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, description, chemicalConfig, status } = req.body;
    const files = req.files as Express.Multer.File[];
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Get the user's full information for the audit log
    const userInfo = await User.findById(user.id);
    if (!userInfo) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store the previous state for audit logging
    const previousTicketState = ticket.toObject();

    // Check if user has permission to update
    if (
      user.role !== 'ADMIN' && 
      // Allow approvers to update status only if moving forward in workflow and not from DRAFT
      !(user.role === 'APPROVER' && req.body.status && 
        ((ticket.requesterId.toString() === user.id) || // Approvers can move their own tickets from any status
         (ticket.status !== 'DRAFT' && // Approvers cannot move other people's tickets from DRAFT
          isForwardMovement(ticket.status, req.body.status)))) &&
      // Allow requesters to update their own tickets
      ticket.requesterId.toString() !== user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    
    // If status is being updated, log it specifically as a status change
    let statusChanged = false;
    if (status && status !== ticket.status) {
      updateData.status = status;
      statusChanged = true;
    }
    
    if (chemicalConfig) {
      try {
        updateData.chemicalConfig = JSON.parse(chemicalConfig);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid chemical configuration format' });
      }
    }

    // Handle new file attachments
    const newAttachments = files?.map(file => ({
      id: file.filename,
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size,
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString()
    })) || [];

    if (newAttachments.length > 0) {
      updateData.$push = { attachments: { $each: newAttachments } };
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('requester');

    if (!updatedTicket) {
      return res.status(404).json({ message: 'Ticket not found after update' });
    }

    // Log the appropriate audit event
    if (statusChanged) {
      // Log status change specifically
      await auditService.logActivity({
        action: 'STATUS_CHANGE',
        entityType: 'TICKET',
        entityId: ticket._id,
        userId: user.id,
        userName: userInfo.fullName,
        userRole: user.role,
        previousValue: { status: previousTicketState.status },
        newValue: { status: updatedTicket.status },
        details: `Status changed from ${previousTicketState.status} to ${updatedTicket.status}`,
        ipAddress: getRequestIP(req),
        userAgent: getUserAgent(req)
      });

      // Also log specific APPROVE or REJECT actions for convenience
      if (updatedTicket.status === 'APPROVED') {
        await auditService.logActivity({
          action: 'APPROVE',
          entityType: 'TICKET',
          entityId: ticket._id,
          userId: user.id,
          userName: userInfo.fullName,
          userRole: user.role,
          details: 'Ticket approved',
          ipAddress: getRequestIP(req),
          userAgent: getUserAgent(req)
        });
      } else if (updatedTicket.status === 'REJECTED') {
        await auditService.logActivity({
          action: 'REJECT',
          entityType: 'TICKET',
          entityId: ticket._id,
          userId: user.id,
          userName: userInfo.fullName,
          userRole: user.role,
          details: 'Ticket rejected',
          ipAddress: getRequestIP(req),
          userAgent: getUserAgent(req)
        });
      }
    } else {
      // Log general update
      await auditService.logActivity({
        action: 'UPDATE',
        entityType: 'TICKET',
        entityId: ticket._id,
        userId: user.id,
        userName: userInfo.fullName,
        userRole: user.role,
        previousValue: sanitizeObject(previousTicketState),
        newValue: sanitizeObject(updatedTicket.toObject()),
        details: 'Ticket updated',
        ipAddress: getRequestIP(req),
        userAgent: getUserAgent(req)
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Error updating ticket', error });
  }
});

// Delete a ticket
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Check if user exists (though authenticateToken middleware should ensure this)
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // Store ticket data before deletion for audit log
    const ticketData = ticket.toObject();
    
    // Delete the ticket
    await Ticket.findByIdAndDelete(req.params.id);
    
    // Get user info for audit log
    const userInfo = await User.findById(user.id);
    if (!userInfo) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log the deletion
    await auditService.logActivity({
      action: 'DELETE',
      entityType: 'TICKET',
      entityId: ticket._id,
      userId: user.id,
      userName: userInfo.fullName,
      userRole: user.role,
      previousValue: sanitizeObject(ticketData),
      details: 'Ticket deleted',
      ipAddress: getRequestIP(req),
      userAgent: getUserAgent(req)
    });
    
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Error deleting ticket', error });
  }
});

export default router; 