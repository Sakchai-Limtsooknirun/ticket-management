import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, User } from '../../types/system';
import '../../styles/tickets/MyTickets.css';

interface MyTicketsProps {
  tickets: Ticket[];
  currentUser: User;
}

const MyTickets: React.FC<MyTicketsProps> = ({ tickets, currentUser }) => {
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('');
  
  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365); // Changed to 1 year by default
    return { startDate: start, endDate: end };
  });
  
  // Add debug logging
  useEffect(() => {
    console.log('MyTickets received tickets:', tickets.length);
    console.log('Current date range:', { 
      startDate: dateRange.startDate.toISOString(), 
      endDate: dateRange.endDate.toISOString() 
    });
  }, [tickets, dateRange]);
  
  // Apply filters
  useEffect(() => {
    console.log('Applying filters to tickets...');
    // Apply all filters
    let filtered = tickets.filter(ticket => {
      if (!ticket) return false;
      
      // User role filter
      let passesRoleFilter = false;
      if (currentUser.role === 'ADMIN') {
        passesRoleFilter = true;
      } else if (currentUser.role === 'APPROVER') {
        passesRoleFilter = ticket.status === 'PENDING' || ticket.requesterId === currentUser._id;
      } else {
        passesRoleFilter = ticket.requesterId === currentUser._id;
      }
      
      if (!passesRoleFilter) return false;
      
      // Date range filter
      const ticketDate = new Date(ticket.requestDate || '');
      const inDateRange = ticketDate >= dateRange.startDate && ticketDate <= dateRange.endDate;
      
      // Debug date filtering
      console.log('Ticket date check:', {
        id: ticket._id,
        title: ticket.title,
        requestDate: ticket.requestDate,
        parsedDate: ticketDate.toISOString(),
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        inRange: inDateRange
      });
      
      if (!inDateRange) return false;
      
      // Status filter
      if (statusFilter && ticket.status !== statusFilter) {
        return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (ticket.title?.toLowerCase().includes(searchLower) ?? false) ||
          (ticket.description?.toLowerCase().includes(searchLower) ?? false) ||
          (ticket.department?.toLowerCase().includes(searchLower) ?? false) ||
          (ticket.chemicalConfig?.machineName?.toLowerCase().includes(searchLower) ?? false)
        );
      }
      
      return true;
    });
    
    console.log(`Filtered tickets: ${filtered.length} of ${tickets.length}`);
    setFilteredTickets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tickets, currentUser, dateRange, statusFilter, searchTerm]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle date filter changes
  const handleDateFilterChange = (type: 'start' | 'end', dateString: string) => {
    // Parse the date in a safer way to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00');
    console.log('Date changed:', { type, dateString, parsedDate: date.toISOString() });
    
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date
    }));
    
    // Reset active filter since user manually selected a date
    setActiveFilter('');
  };
  
  // Add function to set date range to "all time"
  const setAllTimeRange = () => {
    const startDate = new Date('2020-01-01');
    const endDate = new Date();
    console.log('Setting all time range:', { startDate, endDate });
    
    setDateRange({ startDate, endDate });
    setCurrentPage(1); // Reset to first page
    setActiveFilter('allTime');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'PENDING': return 'status-pending';
      default: return 'status-draft';
    }
  };

  const formatId = (id: string | undefined) => {
    if (!id) return 'N/A';
    return id;
  };

  const handleRowClick = (ticketId: string) => {
    if (ticketId) {
      navigate(`/tickets/${ticketId}`);
    }
  };

  return (
    <div className="my-tickets">
      <h2>My Tickets</h2>
      
      <div className="filters-container">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="date-filters">
          <div className="date-filter-group">
            <label>From:</label>
            <input
              type="date"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateFilterChange('start', e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-filter-group">
            <label>To:</label>
            <input
              type="date"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateFilterChange('end', e.target.value)}
              className="date-input"
            />
          </div>
          <button 
            onClick={setAllTimeRange} 
            className={`${activeFilter === "allTime" ? "active-filter" : ""} date-all-time-btn`}
          >
            All Time
          </button>
        </div>
        
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>
      
      <div className="tickets-summary">
        <div className="total-count">
          Total Results: <strong>{filteredTickets.length}</strong>
        </div>
        <div className="showing-info">
          Showing: <strong>{filteredTickets.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, filteredTickets.length)}</strong> of <strong>{filteredTickets.length}</strong>
        </div>
      </div>
      
      <div className="tickets-table-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Department</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Machine</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map(ticket => (
              <tr 
                key={ticket._id || Math.random().toString()}
                onClick={() => ticket._id && handleRowClick(ticket._id)}
                className="ticket-row"
              >
                <td>{formatId(ticket._id)}</td>
                <td>{ticket.title || 'N/A'}</td>
                <td>{ticket.department || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                    {ticket.status || 'DRAFT'}
                  </span>
                </td>
                <td>{formatDate(ticket.requestDate)}</td>
                <td>{ticket.chemicalConfig?.machineName || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTickets.length === 0 && (
          <div className="no-tickets">
            <p>No tickets found</p>
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-button"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`page-button ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default MyTickets; 