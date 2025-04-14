/**
 * Helper function to determine if a status change is a forward movement in the workflow
 * @param currentStatus Current ticket status
 * @param newStatus New ticket status
 * @returns True if the movement is forward in the workflow
 */
export function isForwardMovement(currentStatus: string, newStatus: string): boolean {
  const workflowOrder: { [key: string]: number } = {
    'DRAFT': 0,
    'PENDING': 1,
    'APPROVED': 2,
    'REJECTED': 2  // APPROVED and REJECTED are at the same level
  };
  
  return workflowOrder[newStatus] > workflowOrder[currentStatus];
}

/**
 * Get request IP address
 * @param req Express request object
 * @returns IP address string
 */
export function getRequestIP(req: any): string {
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
export function getUserAgent(req: any): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Strip sensitive data from an object
 * @param obj Original object
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any): any {
  if (!obj) return obj;
  
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