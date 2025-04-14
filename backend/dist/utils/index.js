"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isForwardMovement = isForwardMovement;
exports.getRequestIP = getRequestIP;
exports.getUserAgent = getUserAgent;
exports.sanitizeObject = sanitizeObject;
/**
 * Helper function to determine if a status change is a forward movement in the workflow
 * @param currentStatus Current ticket status
 * @param newStatus New ticket status
 * @returns True if the movement is forward in the workflow
 */
function isForwardMovement(currentStatus, newStatus) {
    const workflowOrder = {
        'DRAFT': 0,
        'PENDING': 1,
        'APPROVED': 2,
        'REJECTED': 2 // APPROVED and REJECTED are at the same level
    };
    return workflowOrder[newStatus] > workflowOrder[currentStatus];
}
/**
 * Get request IP address
 * @param req Express request object
 * @returns IP address string
 */
function getRequestIP(req) {
    return req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        'unknown';
}
/**
 * Get user agent from request
 * @param req Express request object
 * @returns User agent string
 */
function getUserAgent(req) {
    return req.headers['user-agent'] || 'unknown';
}
/**
 * Strip sensitive data from an object
 * @param obj Original object
 * @returns Sanitized object
 */
function sanitizeObject(obj) {
    if (!obj)
        return obj;
    const sanitized = { ...obj };
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    });
    return sanitized;
}
