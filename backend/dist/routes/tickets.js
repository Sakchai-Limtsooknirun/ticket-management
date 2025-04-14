"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Ticket_1 = require("../models/Ticket");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const User_1 = __importDefault(require("../models/User"));
const auditService_1 = require("../services/auditService");
const utils_1 = require("../utils");
const router = express_1.default.Router();
// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
// Create a new ticket
router.post('/', auth_1.auth, upload.array('files'), async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { title, description, chemicalConfig } = req.body;
        const files = req.files;
        // Get the requester's full information
        const requester = await User_1.default.findById(user.id);
        if (!requester) {
            return res.status(404).json({ message: 'User not found' });
        }
        const attachments = (files === null || files === void 0 ? void 0 : files.map(file => ({
            id: file.filename,
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
            uploadedBy: user.id,
            uploadedAt: new Date().toISOString()
        }))) || [];
        const ticket = new Ticket_1.Ticket({
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
        await auditService_1.auditService.logActivity({
            action: 'CREATE',
            entityType: 'TICKET',
            entityId: ticket._id,
            userId: user.id,
            userName: requester.fullName,
            userRole: user.role,
            newValue: (0, utils_1.sanitizeObject)(ticket.toObject()),
            details: 'Ticket created',
            ipAddress: (0, utils_1.getRequestIP)(req),
            userAgent: (0, utils_1.getUserAgent)(req)
        });
        res.status(201).json(ticket);
    }
    catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Error creating ticket', error });
    }
});
// Get all tickets
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
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
        // Build the query
        let query = {
            requestDate: { $gte: startDate, $lte: endDate }
        };
        // Apply role-based filtering:
        // - ADMIN can see all tickets
        // - APPROVER can see all PENDING tickets plus their own tickets
        // - REQUESTER can only see their own tickets
        if (user.role === 'REQUESTER') {
            // Requesters can only see their own tickets
            query.requesterId = user.id;
        }
        else if (user.role === 'APPROVER') {
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
        // Get total count for pagination info
        const total = await Ticket_1.Ticket.countDocuments(query);
        // Execute query with pagination
        const tickets = await Ticket_1.Ticket.find(query)
            .populate('requester')
            .sort({ requestDate: -1 })
            .skip(skip)
            .limit(limit);
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
    }
    catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets', error });
    }
});
// Get a specific ticket
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        const ticket = await Ticket_1.Ticket.findById(req.params.id)
            .populate('requester');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        res.json(ticket);
    }
    catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Error fetching ticket', error });
    }
});
// Update a ticket
router.put('/:id', auth_1.auth, upload.array('files'), async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { title, description, chemicalConfig, status } = req.body;
        const files = req.files;
        const ticket = await Ticket_1.Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        // Get the user's full information for the audit log
        const userInfo = await User_1.default.findById(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Store the previous state for audit logging
        const previousTicketState = ticket.toObject();
        // Check if user has permission to update
        if (user.role !== 'ADMIN' &&
            // Allow approvers to update status only if moving forward in workflow and not from DRAFT
            !(user.role === 'APPROVER' && req.body.status &&
                ((ticket.requesterId.toString() === user.id) || // Approvers can move their own tickets from any status
                    (ticket.status !== 'DRAFT' && // Approvers cannot move other people's tickets from DRAFT
                        (0, utils_1.isForwardMovement)(ticket.status, req.body.status)))) &&
            // Allow requesters to update their own tickets
            ticket.requesterId.toString() !== user.id) {
            return res.status(403).json({ message: 'Not authorized to update this ticket' });
        }
        const updateData = {};
        if (title)
            updateData.title = title;
        if (description)
            updateData.description = description;
        // If status is being updated, log it specifically as a status change
        let statusChanged = false;
        if (status && status !== ticket.status) {
            updateData.status = status;
            statusChanged = true;
        }
        if (chemicalConfig) {
            try {
                updateData.chemicalConfig = JSON.parse(chemicalConfig);
            }
            catch (error) {
                return res.status(400).json({ message: 'Invalid chemical configuration format' });
            }
        }
        // Handle new file attachments
        const newAttachments = (files === null || files === void 0 ? void 0 : files.map(file => ({
            id: file.filename,
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            type: file.mimetype,
            size: file.size,
            uploadedBy: user.id,
            uploadedAt: new Date().toISOString()
        }))) || [];
        if (newAttachments.length > 0) {
            updateData.$push = { attachments: { $each: newAttachments } };
        }
        const updatedTicket = await Ticket_1.Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('requester');
        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found after update' });
        }
        // Log the appropriate audit event
        if (statusChanged) {
            // Log status change specifically
            await auditService_1.auditService.logActivity({
                action: 'STATUS_CHANGE',
                entityType: 'TICKET',
                entityId: ticket._id,
                userId: user.id,
                userName: userInfo.fullName,
                userRole: user.role,
                previousValue: { status: previousTicketState.status },
                newValue: { status: updatedTicket.status },
                details: `Status changed from ${previousTicketState.status} to ${updatedTicket.status}`,
                ipAddress: (0, utils_1.getRequestIP)(req),
                userAgent: (0, utils_1.getUserAgent)(req)
            });
            // Also log specific APPROVE or REJECT actions for convenience
            if (updatedTicket.status === 'APPROVED') {
                await auditService_1.auditService.logActivity({
                    action: 'APPROVE',
                    entityType: 'TICKET',
                    entityId: ticket._id,
                    userId: user.id,
                    userName: userInfo.fullName,
                    userRole: user.role,
                    details: 'Ticket approved',
                    ipAddress: (0, utils_1.getRequestIP)(req),
                    userAgent: (0, utils_1.getUserAgent)(req)
                });
            }
            else if (updatedTicket.status === 'REJECTED') {
                await auditService_1.auditService.logActivity({
                    action: 'REJECT',
                    entityType: 'TICKET',
                    entityId: ticket._id,
                    userId: user.id,
                    userName: userInfo.fullName,
                    userRole: user.role,
                    details: 'Ticket rejected',
                    ipAddress: (0, utils_1.getRequestIP)(req),
                    userAgent: (0, utils_1.getUserAgent)(req)
                });
            }
        }
        else {
            // Log general update
            await auditService_1.auditService.logActivity({
                action: 'UPDATE',
                entityType: 'TICKET',
                entityId: ticket._id,
                userId: user.id,
                userName: userInfo.fullName,
                userRole: user.role,
                previousValue: (0, utils_1.sanitizeObject)(previousTicketState),
                newValue: (0, utils_1.sanitizeObject)(updatedTicket.toObject()),
                details: 'Ticket updated',
                ipAddress: (0, utils_1.getRequestIP)(req),
                userAgent: (0, utils_1.getUserAgent)(req)
            });
        }
        res.json(updatedTicket);
    }
    catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Error updating ticket', error });
    }
});
// Delete a ticket
router.delete('/:id', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        // Check if user exists (though authenticateToken middleware should ensure this)
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const ticket = await Ticket_1.Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        // Store ticket data before deletion for audit log
        const ticketData = ticket.toObject();
        // Delete the ticket
        await Ticket_1.Ticket.findByIdAndDelete(req.params.id);
        // Get user info for audit log
        const userInfo = await User_1.default.findById(user.id);
        if (!userInfo) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Log the deletion
        await auditService_1.auditService.logActivity({
            action: 'DELETE',
            entityType: 'TICKET',
            entityId: ticket._id,
            userId: user.id,
            userName: userInfo.fullName,
            userRole: user.role,
            previousValue: (0, utils_1.sanitizeObject)(ticketData),
            details: 'Ticket deleted',
            ipAddress: (0, utils_1.getRequestIP)(req),
            userAgent: (0, utils_1.getUserAgent)(req)
        });
        res.json({ message: 'Ticket deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Error deleting ticket', error });
    }
});
exports.default = router;
