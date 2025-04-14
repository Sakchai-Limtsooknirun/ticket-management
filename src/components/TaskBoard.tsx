import { FC, useState, useEffect, ReactElement, useCallback } from 'react';
import '../styles/TaskBoard.css';
import { Ticket, TicketStatus, User } from '../types/system';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProps, DroppableProvided, DroppableStateSnapshot } from 'react-beautiful-dnd';
import Toast from './Toast';
import { useNavigate } from 'react-router-dom';
import { getAllTicketsRaw } from '../services/api'; // Import the debug function

interface TaskBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  currentUser: User;
}

// Updated StrictModeDroppable component to fix React 18 warnings
// This is a compatibility wrapper for react-beautiful-dnd in React 18 with StrictMode
const StrictModeDroppable = ({ children, ...props }: DroppableProps & { children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => ReactElement }) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    // Wait until after client-side hydration to enable
    const animation = requestAnimationFrame(() => {
      setEnabled(true);
    });
    
    return () => {
      cancelAnimationFrame(animation);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};

const TaskBoard: FC<TaskBoardProps> = ({ tickets, onStatusChange, currentUser }) => {
  const columns: TicketStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false
  });
  const navigate = useNavigate();
  
  // State for date filter
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to show last 30 days of tickets
    return { startDate: start, endDate: end };
  });
  
  // Adding debug state
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Log received tickets for debugging
  useEffect(() => {
    console.log('TaskBoard received tickets:', tickets);
    console.log('Current date range:', { 
      startDate: dateRange.startDate.toISOString(), 
      endDate: dateRange.endDate.toISOString() 
    });
  }, [tickets, dateRange]);
  
  // State for pagination per column
  const [pagination, setPagination] = useState<{[key in TicketStatus]: {page: number, limit: number}}>({
    'DRAFT': {page: 1, limit: 20},
    'PENDING': {page: 1, limit: 20},
    'APPROVED': {page: 1, limit: 20},
    'REJECTED': {page: 1, limit: 20}
  });
  
  // Filter tickets based on user role
  const filteredTickets = tickets.filter(ticket => {
    // Debug ticket date
    const ticketDate = new Date(ticket.requestDate || '');
    console.log('Filtering ticket:', { 
      id: ticket._id,
      title: ticket.title,
      status: ticket.status, 
      date: ticket.requestDate,
      ticketDate: ticketDate.toISOString(),
      inRange: ticketDate >= dateRange.startDate && ticketDate <= dateRange.endDate
    });
    
    // Date range filter
    if (ticketDate < dateRange.startDate || ticketDate > dateRange.endDate) {
      return false;
    }
    
    // User role filter
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'APPROVER') {
      // Approvers can see all tickets in all statuses
      return true;
    }
    return ticket.requesterId === currentUser._id;
  });

  // Log filtered tickets for debugging
  useEffect(() => {
    console.log('Filtered tickets count:', filteredTickets.length);
  }, [filteredTickets]);
  
  // Group tickets by status
  const ticketsByStatus = columns.reduce((acc, status) => {
    acc[status] = filteredTickets.filter(ticket => ticket.status === status);
    return acc;
  }, {} as {[key in TicketStatus]: Ticket[]});
  
  // Get visible tickets per column with pagination
  const getVisibleTickets = (status: TicketStatus) => {
    const { page, limit } = pagination[status];
    const start = (page - 1) * limit;
    const end = start + limit;
    return ticketsByStatus[status].slice(start, end);
  };
  
  // Handle page change for a column
  const handlePageChange = (status: TicketStatus, increment: number) => {
    setPagination(prev => {
      const columnPagination = {...prev[status]};
      columnPagination.page += increment;
      
      // Ensure page is within valid range
      const maxPage = Math.ceil(ticketsByStatus[status].length / columnPagination.limit) || 1;
      if (columnPagination.page < 1) columnPagination.page = 1;
      if (columnPagination.page > maxPage) columnPagination.page = maxPage;
      
      return {...prev, [status]: columnPagination};
    });
  };
  
  // Handle date filter changes
  const handleDateFilterChange = (type: 'start' | 'end', dateString: string) => {
    // Parse the date, ensuring it's treated as UTC midnight to avoid timezone issues
    let date = new Date(dateString);
    
    // If it's an end date, set it to the end of the day (23:59:59.999)
    if (type === 'end') {
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    }
    
    console.log('Date changed:', { type, dateString, parsedDate: date.toISOString() });
    
    setDateRange(prev => {
      // Reset pagination whenever date filter changes
      Object.keys(pagination).forEach(status => {
        pagination[status as TicketStatus].page = 1;
      });
      
      return {
        ...prev,
        [type === 'start' ? 'startDate' : 'endDate']: date
      };
    });
  };

  // Add a function to set the date range to "all time"
  const setAllTimeRange = () => {
    const startDate = new Date('2020-01-01');
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Set to end of current day
    
    console.log('Setting all time range:', { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });
    
    setDateRange({ startDate, endDate });
    
    // Reset pagination
    Object.keys(pagination).forEach(status => {
      pagination[status as TicketStatus].page = 1;
    });
  };

  // Check if the user can move the ticket from source to destination status
  const canMoveTicket = (
    ticket: Ticket,
    sourceStatus: TicketStatus,
    destinationStatus: TicketStatus
  ): boolean => {
    const role = currentUser.role;
    
    // ADMIN can move tickets freely between any status
    if (role === 'ADMIN') return true;
    
    // APPROVER can only move tickets forward in the workflow, but cannot move from DRAFT
    if (role === 'APPROVER') {
      // Define workflow order for all status determinations
      const workflowOrder: { [key in TicketStatus]: number } = {
        'DRAFT': 0,
        'PENDING': 1,
        'APPROVED': 2,
        'REJECTED': 2  // APPROVED and REJECTED are at the same level
      };
      
      // Approvers can move their own tickets with some restrictions
      if (ticket.requesterId === currentUser._id) {
        // Prevent moving backward from APPROVED or REJECTED to earlier statuses
        if ((sourceStatus === 'APPROVED' || sourceStatus === 'REJECTED') && 
            (destinationStatus === 'PENDING' || destinationStatus === 'DRAFT')) {
          return false;
        }
        return true; // Allow all other movements for own tickets
      }
      
      // For other people's tickets, check if the move is forward in the workflow
      return workflowOrder[destinationStatus] > workflowOrder[sourceStatus];
    }
    
    // REQUESTER can only move their own tickets from DRAFT to PENDING
    if (role === 'REQUESTER') {
      if (ticket.requesterId === currentUser._id && sourceStatus === 'DRAFT' && destinationStatus === 'PENDING') {
        return true;
      }
      return false;
    }
    
    return false;
  };

  const getRequesterName = (ticket: Ticket): string => {
    return ticket.requester?.fullName || 'Unknown User';
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    const { draggableId, source, destination } = result;
    
    // Drop outside any droppable area or same position
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }
    
    // The draggableId is the ticket ID
    const ticketId = draggableId;
    
    // Source and destination are the status columns
    const sourceStatus = source.droppableId as TicketStatus;
    const destinationStatus = destination.droppableId as TicketStatus;
    
    const ticket = tickets.find(t => t._id === ticketId);
    
    if (!ticket) return;
    
    // Check if the user has permission to move the ticket
    if (canMoveTicket(ticket, sourceStatus, destinationStatus)) {
      onStatusChange(ticketId, destinationStatus);
    } else {
      // Show toast notification for permission error
      setToast({
        message: `You don't have permission to move this ticket to ${destinationStatus} status`,
        visible: true
      });
    }
  };
  
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle closing the toast
  const handleCloseToast = () => {
    setToast({ ...toast, visible: false });
  };

  const checkDragDisabled = (ticket: Ticket, status: TicketStatus): boolean => {
    // ADMIN can move any ticket
    if (currentUser.role === 'ADMIN') return false;
    
    // APPROVER permissions
    if (currentUser.role === 'APPROVER') {
      // Allow APPROVERs to drag their own tickets from any status
      if (ticket.requesterId === currentUser._id) return false;
      
      // APPROVERs cannot drag other people's tickets that are in DRAFT status
      return status === 'DRAFT';
    }
    
    // REQUESTER can only move their own tickets from DRAFT to PENDING
    if (currentUser.role === 'REQUESTER') {
      return !(ticket.requesterId === currentUser._id && status === 'DRAFT');
    }
    
    return true;
  };

  // Add a click handler to navigate to ticket detail
  const handleTicketClick = (ticketId: string) => {
    if (!isDragging) {
      navigate(`/tickets/${ticketId}`);
    }
  };

  // Debug function to fetch tickets directly
  const debugFetchTickets = async () => {
    try {
      setDebugInfo('Fetching tickets directly...');
      const rawResponse = await getAllTicketsRaw();
      setDebugInfo(`Raw API response received. Check console for details.`);
      console.log('Raw tickets response:', rawResponse);
    } catch (error: any) {
      setDebugInfo(`Error: ${error?.message || 'Unknown error'}`);
      console.error('Debug fetch error:', error);
    }
  };

  return (
    <>
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type="error" 
          onClose={handleCloseToast} 
        />
      )}
      
      <div className="taskboard-controls">
        <div className="date-filter">
          <div className="filter-group">
            <label>From:</label>
            <input 
              type="date" 
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateFilterChange('start', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>To:</label>
            <input 
              type="date" 
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateFilterChange('end', e.target.value)}
            />
          </div>
          <button 
            onClick={setAllTimeRange}
            style={{
              padding: '0.5rem 1rem',
              marginLeft: '1rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All Time
          </button>
          <button 
            onClick={debugFetchTickets}
            style={{
              padding: '0.5rem 1rem',
              marginLeft: '0.5rem',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Debug API
          </button>
        </div>
        {debugInfo && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Debug Info: {debugInfo}
          </div>
        )}
      </div>
      
      {/* Show a message when no tickets are available */}
      {tickets.length === 0 && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          textAlign: 'center',
          margin: '20px 0'
        }}>
          <h3>No Tickets Available</h3>
          <p>There are no tickets to display. This could be due to:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>No tickets exist in the system</li>
            <li>Date filter excludes all tickets</li>
            <li>API connection issues</li>
            <li>Authentication problems</li>
          </ul>
          <p>Try changing the date range or use the "All Time" button.</p>
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="task-board">
          {columns.map((status) => (
            <div key={status} className="task-column">
              <h3 className="column-title">
                {status} 
                <span className="ticket-count">
                  ({ticketsByStatus[status].length})
                </span>
              </h3>
              
              <StrictModeDroppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`task-list ${snapshot.isDraggingOver ? 'drop-allowed' : ''}`}
                  >
                    {getVisibleTickets(status).map((ticket, index) => {
                      // Determine if this ticket can be dragged
                      const isDragDisabled = checkDragDisabled(ticket, status);
                        
                      return (
                        <Draggable 
                          key={ticket._id} 
                          draggableId={ticket._id}
                          index={index}
                          isDragDisabled={isDragDisabled}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''} ${isDragDisabled ? 'not-draggable' : ''}`}
                              onClick={() => handleTicketClick(ticket._id)}
                            >
                              <div className="task-priority" data-priority={ticket.department}></div>
                              <h4>{ticket.title}</h4>
                              <p>{ticket.description}</p>
                              <div className="task-meta">
                                <span className="assignee">{getRequesterName(ticket)}</span>
                                <span className="due-date">
                                  {ticket.requestDate ? new Date(ticket.requestDate).toLocaleDateString() : 'No date'}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    
                    {/* Pagination controls */}
                    {ticketsByStatus[status].length > pagination[status].limit && (
                      <div className="column-pagination">
                        <button 
                          onClick={() => handlePageChange(status, -1)}
                          disabled={pagination[status].page === 1}
                          className="pagination-btn"
                        >
                          &laquo; Prev
                        </button>
                        <span className="page-indicator">
                          {pagination[status].page} / 
                          {Math.ceil(ticketsByStatus[status].length / pagination[status].limit)}
                        </span>
                        <button 
                          onClick={() => handlePageChange(status, 1)}
                          disabled={
                            pagination[status].page >= 
                            Math.ceil(ticketsByStatus[status].length / pagination[status].limit)
                          }
                          className="pagination-btn"
                        >
                          Next &raquo;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </>
  );
};

export default TaskBoard; 