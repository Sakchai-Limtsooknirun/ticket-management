import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types/system';

interface ProtectedRouteProps {
  children: React.ReactNode;
  currentUser: User;
  requiredRole: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  currentUser, 
  requiredRole 
}) => {
  // Check if required role is a string or array of strings
  if (Array.isArray(requiredRole)) {
    // Allow access if user role is included in the required roles array
    if (!requiredRole.map(role => role.toUpperCase()).includes(currentUser.role.toUpperCase())) {
      return <Navigate to="/" replace />;
    }
  } else {
    // Check against single role
    if (currentUser.role.toUpperCase() !== requiredRole.toUpperCase()) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 