import React from 'react';
import { useNavigate } from 'react-router-dom';
import Home from './Home';
import TicketCreation from './tickets/TicketCreation';
import { User, Ticket, TicketStatus } from '../types/system';

interface RouteWrapperProps {
  component: 'home' | 'create';
  tickets?: Ticket[];
  currentUser: User;
  onCreateRequest: (navigate: (path: string) => void) => void;
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void;
  onSubmit?: (data: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>, navigate: (path: string) => void) => Promise<void>;
}

const RouteWrapper: React.FC<RouteWrapperProps> = ({ 
  component, 
  tickets = [], 
  currentUser, 
  onCreateRequest, 
  onStatusChange = () => {}, 
  onSubmit = async () => {} 
}) => {
  const navigate = useNavigate();

  if (component === 'home') {
    return (
      <Home 
        tickets={tickets}
        currentUser={currentUser}
        onCreateRequest={() => onCreateRequest(navigate)}
        onStatusChange={onStatusChange}
      />
    );
  }

  if (component === 'create') {
    return (
      <TicketCreation 
        currentUser={currentUser}
        onSubmit={async (data:any) => await onSubmit(data, navigate)}
      />
    );
  }

  return null;
};

export default RouteWrapper; 