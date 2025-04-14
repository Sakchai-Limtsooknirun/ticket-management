import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketStatus } from '../../types/system';
import '../../styles/admin/RequestManagement.css';
import { useNavigate } from 'react-router-dom';

interface RequestManagementProps {
  tickets: Ticket[];
  currentUser: User;
  onUpdate: (ticketId: string, updatedData: Partial<Ticket>) => Promise<void>;
}

const RequestManagement: React.FC<RequestManagementProps> = ({ tickets, currentUser, onUpdate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365); // Changed to 1 year by default
    return { startDate: start, endDate: end };
  });
  const pageSize = 20;
  const navigate = useNavigate();

  // Add debug logging
  useEffect(() => {
    console.log('RequestManagement received tickets:', tickets.length);
    console.log('Current date range:', { 
      startDate: dateRange.startDate.toISOString(), 
      endDate: dateRange.endDate.toISOString() 
    });
  }, [tickets, dateRange]);

  useEffect(() => {
    let filtered = [...tickets];

    // Apply date filter
    filtered = filtered.filter(ticket => {
      const ticketDate = new Date(ticket.requestDate || '');
      const inDateRange = ticketDate >= dateRange.startDate && ticketDate <= dateRange.endDate;
      
      // Debug date filtering
      console.log('Admin ticket date check:', {
        id: ticket._id,
        title: ticket.title,
        requestDate: ticket.requestDate,
        parsedDate: ticketDate.toISOString(),
        inRange: inDateRange
      });
      
      return inDateRange;
    });

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.requester?.email?.toLowerCase().includes(searchLower) ||
        ticket.requester?.username?.toLowerCase().includes(searchLower) ||
        ticket.title?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    console.log(`Admin filtered tickets: ${filtered.length} of ${tickets.length}`);
    setFilteredTickets(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tickets, searchTerm, statusFilter, dateRange]);

  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'PENDING': return 'status-pending';
      default: return 'status-draft';
    }
  };

  // Handle edit button click to navigate to ticket detail page
  const handleEditClick = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  // Handle date filter changes
  const handleDateFilterChange = (type: 'start' | 'end', dateString: string) => {
    // Parse the date in a safer way to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00');
    console.log('Admin date changed:', { type, dateString, parsedDate: date.toISOString() });
    
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date
    }));
  };

  return (
    <div className="request-management">
      <div className="request-management-header">
        <h2>Request Management</h2>
        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by title, user email or username..."
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
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus)}
            className="status-filter"
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
          Showing: <strong>{startIndex + 1}-{Math.min(startIndex + pageSize, filteredTickets.length)}</strong> of <strong>{filteredTickets.length}</strong>
        </div>
      </div>

      <div className="tickets-table-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Created By</th>
              <th>Department</th>
              <th>Status</th>
              <th>Request Date</th>
              <th>Machine</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map(ticket => (
              <tr key={ticket._id} className="ticket-row">
                <td>{ticket._id}</td>
                <td>{ticket.title}</td>
                <td>
                  <div className="user-info">
                    <span className="user-email">{ticket.requester?.email}</span>
                    <span className="user-name">{ticket.requester?.username}</span>
                  </div>
                </td>
                <td>{ticket.department}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>{formatDate(ticket.requestDate)}</td>
                <td>{ticket.chemicalConfig?.machineName || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    {currentUser.role.toUpperCase() === 'ADMIN' && (
                      <button 
                        className="edit-button"
                        onClick={() => handleEditClick(ticket._id)}
                      >
                        Edit
                      </button>
                    )}
                    <select
                      className="status-select"
                      value={ticket.status}
                      onChange={(e) => onUpdate(ticket._id, { status: e.target.value as TicketStatus })}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTickets.length === 0 && (
        <div className="no-tickets">
          <p>No tickets found</p>
        </div>
      )}

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
};

export default RequestManagement; 