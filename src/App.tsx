import { FC, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import RouteWrapper from './components/RouteWrapper';
import MyTickets from './components/tickets/MyTickets';
import Login from './components/Login';
import { User, Ticket, TicketStatus } from './types/system';
import { 
  createTicket, 
  getTickets, 
  updateTicketStatus, 
  updateTicket, 
  getAllTicketsRaw,
  checkApiConnection 
} from './services/api';
import TicketDetail from './components/tickets/TicketDetail';
import RequestManagement from './components/admin/RequestManagement';
import ProtectedRoute from './components/ProtectedRoute';

const App: FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [debugInfo, setDebugInfo] = useState<{ visible: boolean; data: any }>({
    visible: false,
    data: null
  });
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline' | 'auth_issue'>('unknown');
  const [showStartServerInstructions, setShowStartServerInstructions] = useState(false);

  useEffect(() => {
    // Check for existing auth token and user data
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('Loaded user:', parsedUser); // Debug log
        console.log('Token found:', token ? 'Yes (length: ' + token.length + ')' : 'No');
        setIsAuthenticated(true);
        setCurrentUser(parsedUser);
        // Fetch tickets when authenticated
        fetchTickets();
        // Check server status quietly (no UI indicators)
        checkServerStatusQuietly();
      } catch (error: any) {
        console.error('Error parsing saved user data:', error);
        // Handle corrupted user data by clearing it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    } else {
      console.log('No authentication found. Token:', !!token, 'User:', !!savedUser);
    }
  }, []);

  const fetchTickets = async (dateRange?: { startDate?: Date, endDate?: Date }) => {
    try {
      // Use a default date range if none provided (all time)
      if (!dateRange) {
        const end = new Date();
        const start = new Date(2020, 0, 1); // Jan 1, 2020 instead of 365 days
        dateRange = { startDate: start, endDate: end };
      }
      
      // Ensure startDate and endDate are defined
      const safeRange = {
        startDate: dateRange.startDate || new Date(2020, 0, 1),
        endDate: dateRange.endDate || new Date()
      };
      
      console.log('App fetching tickets with date range:', {
        startDate: safeRange.startDate.toISOString(),
        endDate: safeRange.endDate.toISOString()
      });
      
      const response = await getTickets(undefined, 1, 100, safeRange);
      
      // Check if there was an error in the response
      if (response.error) {
        console.error('Error in ticket response:', response.error);
        setDebugInfo({
          visible: true,
          data: {
            status: 'error',
            message: 'Error fetching tickets',
            error: response.error,
            timestamp: new Date().toISOString()
          }
        });
        // Keep existing tickets instead of setting empty array
        return;
      }
      
      // Handle response with tickets
      if (response.tickets && Array.isArray(response.tickets)) {
        const ticketsArray = response.tickets;
        console.log(`App received ${ticketsArray.length} tickets`);
        
        // Log first ticket data for debugging
        if (ticketsArray.length > 0) {
          console.log('First ticket sample:', {
            id: ticketsArray[0]._id,
            title: ticketsArray[0].title,
            status: ticketsArray[0].status,
            date: ticketsArray[0].requestDate
          });
        }
        
        setTickets(ticketsArray);
      } else {
        console.warn('Unexpected ticket response format:', response);
        setTickets([]);
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      setDebugInfo({
        visible: true,
        data: {
          status: 'error',
          message: 'Exception fetching tickets',
          error: error?.message || 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      
      // If we get an authentication error, clear the token and redirect to login
      if (error?.response && error.response.status === 401) {
        console.error('Authentication error. Redirecting to login.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
  };

  const handleLoginSuccess = (token: string, user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    // Fetch tickets after successful login
    fetchTickets();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTickets([]);
  };

  const handleCreateRequest = () => {
    // Use navigate directly in components that need it
    window.location.href = '/tickets/create';
  };

  const handleTicketSubmit = async (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>, navigate: (path: string) => void) => {
    try {
      await createTicket(ticketData);
      // Fetch updated tickets list
      await fetchTickets();
      navigate('/tickets');
      alert('Ticket created successfully!');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      // Fetch updated tickets list
      await fetchTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status. Please try again.');
    }
  };

  const handleUpdateTicket = async (ticketId: string, updatedData: Partial<Ticket>) => {
    try {
      if ('status' in updatedData) {
        // Use status-specific endpoint for status updates
        await updateTicketStatus(ticketId, updatedData.status as TicketStatus);
      } else {
        // Use general update endpoint for other updates
        await updateTicket(ticketId, updatedData);
      }
      // Fetch updated tickets list
      await fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket. Please try again.');
    }
  };

  // Add debug function to directly fetch and display the raw API response
  const debugApiCall = async () => {
    try {
      setDebugInfo({
        visible: true,
        data: { status: 'loading', message: 'Fetching data from API...' }
      });
      
      // Call the raw tickets endpoint
      const rawResponse = await getAllTicketsRaw();
      
      console.log('DEBUG: Raw API response:', rawResponse);
      
      // Show detailed debug info
      setDebugInfo({
        visible: true,
        data: {
          status: 'success',
          timestamp: new Date().toISOString(),
          endpoint: '/tickets',
          response: rawResponse,
          auth: {
            tokenExists: !!localStorage.getItem('token'),
            tokenLength: localStorage.getItem('token')?.length || 0,
            userInfo: currentUser ? {
              id: currentUser._id,
              role: currentUser.role,
              email: currentUser.email
            } : 'No user data'
          }
        }
      });
    } catch (error: any) {
      console.error('Debug API call failed:', error);
      setDebugInfo({
        visible: true,
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          message: error?.message || 'Unknown error',
          details: error?.response?.data || {},
          stack: error?.stack || ''
        }
      });
    }
  };

  // Improved test ticket creation with detailed responses
  const createTestTicket = async () => {
    if (!currentUser) return;
    
    try {
      console.log('Creating test ticket...');
      setDebugInfo({
        visible: true,
        data: { status: 'loading', message: 'Creating test ticket...' }
      });
      
      const testTicketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'> = {
        _id: '', // This will be generated by the server
        title: 'Test Ticket ' + new Date().toISOString(),
        description: 'This is a test ticket created for debugging.',
        requesterId: currentUser._id,
        department: currentUser.department,
        chemicalConfig: {
          machineId: 'TEST-MACHINE',
          machineName: 'Test Machine',
          chemicalType: 'Test Chemical',
          concentration: 1.0,
          temperature: 25.0,
          flowRate: 1.0
        },
        requestDate: new Date().toISOString()
      };
      
      const response = await createTicket(testTicketData);
      console.log('Test ticket created successfully:', response);
      
      // Show success info
      setDebugInfo({
        visible: true,
        data: {
          status: 'success',
          message: 'Test ticket created successfully',
          ticketData: response,
          timestamp: new Date().toISOString()
        }
      });
      
      // Fetch tickets again
      fetchTickets();
    } catch (error: any) {
      console.error('Error creating test ticket:', error);
      setDebugInfo({
        visible: true,
        data: {
          status: 'error',
          message: `Error creating test ticket: ${error?.message || 'Unknown error'}`,
          details: error?.response?.data || {},
          timestamp: new Date().toISOString()
        }
      });
      alert(`Error creating test ticket: ${error?.message || 'Unknown error'}`);
    }
  };

  // Function to close debug panel
  const closeDebugPanel = () => {
    setDebugInfo({ ...debugInfo, visible: false });
  };

  // Add a quiet server status check function (no UI feedback)
  const checkServerStatusQuietly = async () => {
    try {
      console.log('Checking server status quietly...');
      const connectionInfo = await checkApiConnection();
      
      if (connectionInfo.overallStatus === 'server_unreachable') {
        setServerStatus('offline');
      } else if (connectionInfo.overallStatus === 'auth_issue') {
        setServerStatus('auth_issue');
      } else {
        setServerStatus('online');
      }
      
      console.log('Server status:', serverStatus);
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerStatus('offline');
    }
  };

  // Update the server connection check to also update status
  const checkServerConnection = async () => {
    try {
      setDebugInfo({
        visible: true,
        data: { status: 'loading', message: 'Checking API server connection...' }
      });
      
      const connectionInfo = await checkApiConnection();
      
      console.log('Server connection check:', connectionInfo);
      
      // Update server status
      if (connectionInfo.overallStatus === 'server_unreachable') {
        setServerStatus('offline');
      } else if (connectionInfo.overallStatus === 'auth_issue') {
        setServerStatus('auth_issue');
      } else {
        setServerStatus('online');
      }
      
      // Show detailed connection info
      setDebugInfo({
        visible: true,
        data: {
          status: 'connection_check',
          timestamp: new Date().toISOString(),
          title: 'API Server Connection Status',
          connection: connectionInfo,
          recommendations: getConnectionRecommendations(connectionInfo)
        }
      });
    } catch (error: any) {
      console.error('Connection check failed:', error);
      setServerStatus('offline');
      setDebugInfo({
        visible: true,
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          message: 'Connection check failed',
          error: error?.message || 'Unknown error',
          stack: error?.stack || ''
        }
      });
    }
  };
  
  // Helper function to generate recommendations based on connection check results
  const getConnectionRecommendations = (connectionInfo: any): string[] => {
    const recommendations: string[] = [];
    
    if (connectionInfo.overallStatus === 'server_unreachable') {
      recommendations.push('The backend server is not reachable. Check if the server is running on the correct port.');
      recommendations.push('Verify that the API_BASE_URL is correct (currently: ' + connectionInfo.apiBaseUrl + ')');
      recommendations.push('Check for network connectivity issues or firewall restrictions.');
      recommendations.push('Make sure the server is running on port 5001 (or update API_BASE_URL if different).');
    } else if (connectionInfo.overallStatus === 'auth_issue') {
      recommendations.push('The server is reachable, but authentication is failing.');
      recommendations.push('Your auth token may be invalid or expired. Try logging out and back in.');
      recommendations.push('Check if your user account has the proper permissions on the server.');
    } else if (connectionInfo.summary?.successfulChecks === 0) {
      recommendations.push('All connectivity checks failed. This could indicate a CORS issue.');
      recommendations.push('Check browser console for CORS-related errors.');
      recommendations.push('Verify that the backend server has the correct CORS headers configured.');
    }
    
    return recommendations;
  };

  // Show instructions to start the server
  const showServerInstructions = () => {
    setShowStartServerInstructions(true);
  };

  // Hide server instructions
  const hideServerInstructions = () => {
    setShowStartServerInstructions(false);
  };

  if (!isAuthenticated || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // If authenticated but no tickets, add a debug button
  if (tickets.length === 0) {
    console.log('No tickets found. Adding debug UI...');
  }

  return (
    <BrowserRouter>
      {/* Server Status Indicator */}
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 
            serverStatus === 'online' ? 'rgba(40, 167, 69, 0.8)' : 
            serverStatus === 'offline' ? 'rgba(220, 53, 69, 0.8)' : 
            serverStatus === 'auth_issue' ? 'rgba(255, 193, 7, 0.8)' : 
            'rgba(108, 117, 125, 0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onClick={checkServerConnection}
        title="Click to check server connection"
      >
        <div 
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 
              serverStatus === 'online' ? '#28a745' : 
              serverStatus === 'offline' ? '#dc3545' : 
              serverStatus === 'auth_issue' ? '#ffc107' : 
              '#6c757d',
            marginRight: '8px',
            boxShadow: '0 0 5px rgba(255,255,255,0.5)'
          }}
        ></div>
        Backend Server: {
          serverStatus === 'online' ? 'Online' : 
          serverStatus === 'offline' ? 'Offline' : 
          serverStatus === 'auth_issue' ? 'Auth Issue' : 
          'Unknown'
        }
      </div>

      {/* Start Server Instructions Modal */}
      {showStartServerInstructions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            color: '#333'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Start Backend Server</h2>
              <button 
                onClick={hideServerInstructions}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <p>Follow these steps to start the backend server:</p>
            
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px',
              fontFamily: 'monospace',
              marginBottom: '20px'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>1. Open a terminal and navigate to your project folder:</p>
              <div style={{ 
                backgroundColor: '#333', 
                color: '#fff', 
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                cd /Users/a667227/Desktop/Work/ticket-management
              </div>
              
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>2. Navigate to the backend directory:</p>
              <div style={{ 
                backgroundColor: '#333', 
                color: '#fff', 
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                cd backend
              </div>
              
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>3. Install dependencies (if needed):</p>
              <div style={{ 
                backgroundColor: '#333', 
                color: '#fff', 
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                npm install
              </div>
              
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>4. Start the server:</p>
              <div style={{ 
                backgroundColor: '#333', 
                color: '#fff', 
                padding: '10px',
                borderRadius: '4px'
              }}>
                npm run dev
                <br />
                <span style={{ color: '#999' }}>// or: npm start</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={hideServerInstructions}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  hideServerInstructions();
                  checkServerConnection();
                }}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Check Connection Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug panel */}
      {debugInfo.visible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          overflow: 'auto',
          padding: '20px',
          color: '#fff',
          fontFamily: 'monospace'
        }}>
          <div style={{ 
            backgroundColor: '#1e1e1e', 
            padding: '20px', 
            borderRadius: '8px',
            maxWidth: '1200px',
            margin: '0 auto',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: '#61dafb', margin: 0 }}>
                {debugInfo.data?.title || 'API Debug Information'}
              </h2>
              <button 
                onClick={closeDebugPanel}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
            
            {/* Add recommendations section for connection check */}
            {debugInfo.data?.status === 'connection_check' && debugInfo.data.recommendations && debugInfo.data.recommendations.length > 0 && (
              <div style={{
                backgroundColor: '#2d2d2d',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '15px',
                border: '1px solid #ffc107'
              }}>
                <h3 style={{ color: '#ffc107', marginTop: 0 }}>Recommendations</h3>
                <ul style={{ color: '#fff', paddingLeft: '20px' }}>
                  {debugInfo.data.recommendations.map((rec: string, index: number) => (
                    <li key={index} style={{ marginBottom: '8px' }}>{rec}</li>
                  ))}
                </ul>
                {debugInfo.data.connection?.overallStatus === 'server_unreachable' && (
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#463022', borderRadius: '4px' }}>
                    <p><strong>Steps to start the server:</strong></p>
                    <ol style={{ paddingLeft: '20px' }}>
                      <li>Open a terminal in your project root</li>
                      <li>Navigate to the backend folder: <code>cd backend</code></li>
                      <li>Install dependencies if needed: <code>npm install</code></li>
                      <li>Start the server: <code>npm start</code> or <code>node server.js</code></li>
                    </ol>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ 
              backgroundColor: '#2d2d2d', 
              padding: '15px', 
              borderRadius: '4px',
              overflowX: 'auto'
            }}>
              <pre style={{ 
                maxHeight: '80vh', 
                margin: 0, 
                color: debugInfo.data?.status === 'error' ? '#ff6b6b' : '#a3e635' 
              }}>
                {JSON.stringify(debugInfo.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug tools bar */}
      <div style={{
        padding: '10px',
        backgroundColor: '#343a40',
        color: 'white',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <button 
          onClick={checkServerConnection}
          style={{
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Check Server Connection
        </button>
        {serverStatus === 'offline' && (
          <button
            onClick={showServerInstructions}
            style={{
              padding: '5px 10px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Start Backend Server
          </button>
        )}
        <button 
          onClick={createTestTicket}
          style={{
            padding: '5px 10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Create Test Ticket
        </button>
        <button
          onClick={debugApiCall}
          style={{
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none', 
            borderRadius: '4px'
          }}
        >
          Debug API Response
        </button>
        <button
          onClick={() => fetchTickets()}
          style={{
            padding: '5px 10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none', 
            borderRadius: '4px'
          }}
        >
          Refresh Tickets
        </button>
      </div>

      {/* Show server offline message instead of no tickets when appropriate */}
      {serverStatus === 'offline' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          textAlign: 'center',
          margin: '10px',
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Backend Server is Offline</h3>
          <p>The application cannot retrieve tickets because the backend server is not running.</p>
          <button
            onClick={showServerInstructions}
            style={{
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Show Instructions to Start Server
          </button>
        </div>
      )}

      {/* "No tickets" warning when server is online but no tickets found */}
      {tickets.length === 0 && serverStatus !== 'offline' && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8f9fa',
          color: '#6c757d',
          textAlign: 'center',
          margin: '10px',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <p>No tickets found. Use the debug tools above to investigate.</p>
        </div>
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            <Layout 
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        >
          <Route index element={
            <RouteWrapper 
              component="home"
              tickets={tickets}
              currentUser={currentUser}
              onCreateRequest={handleCreateRequest}
              onStatusChange={handleTicketStatusChange}
            />
          } />
          <Route 
            path="tickets"
            element={
              <MyTickets
                tickets={tickets}
                currentUser={currentUser}
              />
            }
          />
          <Route 
            path="tickets/create" 
            element={
              <RouteWrapper 
                component="create"
                currentUser={currentUser}
                onCreateRequest={handleCreateRequest}
                onSubmit={handleTicketSubmit}
              />
            } 
          />
          <Route 
            path="/my-tickets" 
            element={
              <MyTickets 
                tickets={tickets} 
                currentUser={currentUser}
              />
            } 
          />
          <Route 
            path="/tickets/:id" 
            element={
              <TicketDetail 
                tickets={tickets} 
                currentUser={currentUser} 
                onUpdate={handleUpdateTicket} 
              />
            } 
          />
          <Route 
            path="/admin/requests" 
            element={
              <ProtectedRoute currentUser={currentUser} requiredRole={['ADMIN', 'APPROVER']}>
                <RequestManagement
                  tickets={tickets}
                  currentUser={currentUser}
                  onUpdate={handleUpdateTicket}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App; 