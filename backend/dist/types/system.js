"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemTypes = void 0;
// Export all types in a namespace as well for compatibility
exports.SystemTypes = {
    UserRole: ['REQUESTER', 'APPROVER', 'ADMIN'],
    Department: ['PRODUCTION', 'QUALITY', 'MAINTENANCE', 'ENGINEERING'],
    TicketStatus: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'],
    AuditAction: [
        'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE',
        'VIEW', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'
    ],
    EntityType: [
        'TICKET', 'USER', 'CHEMICAL_CONFIG', 'ATTACHMENT', 'SYSTEM'
    ]
};
