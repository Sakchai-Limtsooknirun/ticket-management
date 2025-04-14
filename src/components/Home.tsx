import React from 'react';
import Products from './Products';
import TaskBoard from './TaskBoard';
import { User, Ticket, TicketStatus } from '../types/system';

interface HomeProps {
  tickets: Ticket[];
  currentUser: User;
  onCreateRequest: () => void;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

const Home: React.FC<HomeProps> = ({ tickets, currentUser, onCreateRequest, onStatusChange }) => {
  return (
    <>
      <Products onCreateRequest={onCreateRequest} currentUser={currentUser} />
      <TaskBoard 
        tickets={tickets}
        onStatusChange={onStatusChange}
        currentUser={currentUser}
      />
    </>
  );
};

export default Home; 