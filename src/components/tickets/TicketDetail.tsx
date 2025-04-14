import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Ticket, User, ChemicalConfig } from '../../types/system';
import '../../styles/tickets/TicketDetail.css';

interface TicketDetailProps {
  currentUser: User;
  tickets: Ticket[];
  onUpdate: (ticketId: string, updatedData: Partial<Ticket>) => Promise<void>;
}

// Define a status change history interface
interface StatusChange {
  id: string;
  ticketId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: {
    _id: string;
    fullName: string;
    role: string;
  };
  changedAt: string;
  comments?: string;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ currentUser, tickets, onUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Ticket>>({});
  const [unauthorized, setUnauthorized] = useState(false);
  const [chemicalConfig, setChemicalConfig] = useState<ChemicalConfig>({
    machineId: '',
    machineName: '',
    chemicalType: '',
    concentration: 0,
    temperature: 0,
    flowRate: 0,
  });

  useEffect(() => {
    const foundTicket = tickets.find(t => t._id === id);
    
    // If ticket not found, set ticket to null
    if (!foundTicket) {
      setTicket(null);
      return;
    }
    
    // Security check: Requesters can only see their own tickets
    if (currentUser.role === 'REQUESTER' && foundTicket.requesterId !== currentUser._id) {
      setUnauthorized(true);
      return;
    }
    
    // If all checks pass, set the ticket
    setTicket(foundTicket);
    setChemicalConfig(foundTicket.chemicalConfig || chemicalConfig);
  }, [id, tickets, currentUser]);

  const canEdit = currentUser.role === 'ADMIN' || 
    (ticket?.status === 'DRAFT' && ticket.requesterId === currentUser._id);

  const handleEdit = () => {
    if (!ticket) return;
    setEditedData({
      title: ticket.title,
      description: ticket.description,
      chemicalConfig: ticket.chemicalConfig,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!ticket || !editedData) return;
    try {
      await onUpdate(ticket._id, {
        ...editedData,
        chemicalConfig,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  // If user is unauthorized, redirect to home page
  if (unauthorized) {
    return <Navigate to="/" replace />;
  }

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  return (
    <div className="ticket-detail">
      <div className="ticket-header">
        <h2>{isEditing ? 'Edit Ticket' : 'Ticket Details'}</h2>
        {canEdit && !isEditing && (
          <button onClick={handleEdit} className="edit-button">
            Edit
          </button>
        )}
      </div>

      <div className="ticket-content">
        <div className="ticket-section">
          <h3>Basic Information</h3>
          {isEditing ? (
            <>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editedData.title || ''}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editedData.description || ''}
                  onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="detail-item">
                <label>Title:</label>
                <span>{ticket.title}</span>
              </div>
              <div className="detail-item">
                <label>Description:</label>
                <span>{ticket.description}</span>
              </div>
            </>
          )}
        </div>

        <div className="ticket-section">
          <h3>Chemical Configuration</h3>
          {isEditing ? (
            <>
              <div className="form-group">
                <label>Machine ID</label>
                <input
                  type="text"
                  value={chemicalConfig.machineId}
                  onChange={(e) => setChemicalConfig({ ...chemicalConfig, machineId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Machine Name</label>
                <input
                  type="text"
                  value={chemicalConfig.machineName}
                  onChange={(e) => setChemicalConfig({ ...chemicalConfig, machineName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Chemical Type</label>
                <input
                  type="text"
                  value={chemicalConfig.chemicalType}
                  onChange={(e) => setChemicalConfig({ ...chemicalConfig, chemicalType: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Concentration (%)</label>
                  <input
                    type="number"
                    value={chemicalConfig.concentration}
                    onChange={(e) => setChemicalConfig({ ...chemicalConfig, concentration: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Temperature (°C)</label>
                  <input
                    type="number"
                    value={chemicalConfig.temperature}
                    onChange={(e) => setChemicalConfig({ ...chemicalConfig, temperature: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Flow Rate (L/min)</label>
                  <input
                    type="number"
                    value={chemicalConfig.flowRate}
                    onChange={(e) => setChemicalConfig({ ...chemicalConfig, flowRate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="detail-item">
                <label>Machine:</label>
                <span>{ticket.chemicalConfig?.machineName} ({ticket.chemicalConfig?.machineId})</span>
              </div>
              <div className="detail-item">
                <label>Chemical Type:</label>
                <span>{ticket.chemicalConfig?.chemicalType}</span>
              </div>
              <div className="detail-item">
                <label>Configuration:</label>
                <span>
                  Concentration: {ticket.chemicalConfig?.concentration}% |
                  Temperature: {ticket.chemicalConfig?.temperature}°C |
                  Flow Rate: {ticket.chemicalConfig?.flowRate} L/min
                </span>
              </div>
            </>
          )}
        </div>

        <div className="ticket-section">
          <h3>Status Information</h3>
          <div className="detail-item">
            <label>Status:</label>
            <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
              {ticket.status}
            </span>
          </div>
          <div className="detail-item">
            <label>Department:</label>
            <span>{ticket.department}</span>
          </div>
          <div className="detail-item">
            <label>Request Date:</label>
            <span>{new Date(ticket.requestDate || '').toLocaleString()}</span>
          </div>
        </div>

        {/* New Status History Section */}
        <div className="ticket-section status-history-section">
          <h3>Status History</h3>
          {/* Mock data - should be replaced with actual data from API */}
          {getMockStatusHistory(ticket).length > 0 ? (
            <div className="status-timeline">
              {getMockStatusHistory(ticket).map((change) => (
                <div key={change.id} className="timeline-item">
                  <div className="timeline-indicator">
                    <div className={`status-dot status-${change.newStatus.toLowerCase()}`}></div>
                    <div className="timeline-line"></div>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className={`status-badge status-${change.newStatus.toLowerCase()}`}>
                        {change.newStatus}
                      </span>
                      <span className="timeline-date">
                        {new Date(change.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="timeline-body">
                      <p>
                        <strong>{change.changedBy.fullName}</strong> 
                        <span className="user-role">{change.changedBy.role}</span>
                        {change.previousStatus ? 
                          ` changed status from ${change.previousStatus} to ${change.newStatus}` : 
                          ` created ticket with status ${change.newStatus}`}
                      </p>
                      {change.comments && (
                        <p className="timeline-comment">{change.comments}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <p>No status changes recorded yet.</p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="button-group">
            <button onClick={handleSave} className="save-button">
              Save Changes
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to generate mock status history
function getMockStatusHistory(ticket: Ticket): StatusChange[] {
  // This would be replaced with actual data from API
  // For now, creating mock data based on current ticket
  
  const mockHistory: StatusChange[] = [];
  
  // Creation entry (always exists)
  mockHistory.push({
    id: '1',
    ticketId: ticket._id,
    previousStatus: '',
    newStatus: 'DRAFT',
    changedBy: {
      _id: ticket.requesterId,
      fullName: ticket.requester?.fullName || 'Unknown User',
      role: 'REQUESTER'
    },
    changedAt: ticket.requestDate || new Date().toISOString(),
    comments: 'Ticket created'
  });
  
  // If not DRAFT, add a status change to PENDING
  if (ticket.status !== 'DRAFT') {
    mockHistory.push({
      id: '2',
      ticketId: ticket._id,
      previousStatus: 'DRAFT',
      newStatus: 'PENDING',
      changedBy: {
        _id: ticket.requesterId,
        fullName: ticket.requester?.fullName || 'Unknown User',
        role: 'REQUESTER'
      },
      changedAt: addDays(ticket.requestDate || new Date().toISOString(), 1),
      comments: 'Submitted for approval'
    });
  }
  
  // If APPROVED or REJECTED, add appropriate status change
  if (ticket.status === 'APPROVED' || ticket.status === 'REJECTED') {
    mockHistory.push({
      id: '3',
      ticketId: ticket._id,
      previousStatus: 'PENDING',
      newStatus: ticket.status,
      changedBy: {
        _id: 'approver123', // Mock approver ID
        fullName: 'Jane Approver',
        role: 'APPROVER'
      },
      changedAt: addDays(ticket.requestDate || new Date().toISOString(), 2),
      comments: ticket.status === 'APPROVED' 
        ? 'Request approved as per specifications'
        : 'Request rejected due to incomplete information'
    });
  }
  
  return mockHistory;
}

// Helper function to add days to date
function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export default TicketDetail; 