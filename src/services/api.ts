import axios, { InternalAxiosRequestConfig } from 'axios';
import { Ticket, TicketStatus } from '../types/system';

// Update API base URL - the backend routes are already using this pattern
const API_BASE_URL = 'http://localhost:5001';

// Add a simple ping function to check API connectivity
export const checkApiConnection = async (): Promise<any> => {
  console.log('Checking API connectivity');
  const connectionInfo: any = {
    apiBaseUrl: API_BASE_URL,
    checks: [],
    systemInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      connectionType: (navigator as any).connection ? 
        (navigator as any).connection.effectiveType : 'unknown'
    },
    auth: {
      hasToken: !!localStorage.getItem('token'),
      tokenLength: localStorage.getItem('token')?.length || 0
    },
    startTime: new Date().toISOString()
  };
  
  try {
    // Check 1: Simple connectivity check - OPTIONS request
    connectionInfo.checks.push({
      name: 'Basic OPTIONS Request',
      endpoint: '/',
      method: 'OPTIONS',
      startTime: new Date().toISOString(),
      status: 'pending'
    });
    
    try {
      const optionsResponse = await axios.options(`${API_BASE_URL}/`);
      connectionInfo.checks[0].status = 'success';
      connectionInfo.checks[0].statusCode = optionsResponse.status;
      connectionInfo.checks[0].headers = optionsResponse.headers;
    } catch (error: any) {
      connectionInfo.checks[0].status = 'error';
      connectionInfo.checks[0].error = {
        message: error.message,
        code: error.code
      };
    }
    connectionInfo.checks[0].endTime = new Date().toISOString();
    
    // Check 2: Auth status endpoint - note: Using the auth login endpoint for checking
    connectionInfo.checks.push({
      name: 'Auth Status Endpoint',
      endpoint: '/',
      method: 'GET',
      startTime: new Date().toISOString(),
      status: 'pending'
    });
    
    try {
      // Use root endpoint as status check since API is working
      const statusResponse = await axios.get(`${API_BASE_URL}/`);
      connectionInfo.checks[1].status = 'success';
      connectionInfo.checks[1].statusCode = statusResponse.status;
      connectionInfo.checks[1].data = statusResponse.data;
      connectionInfo.checks[1].message = 'Server is online';
      connectionInfo.serverStatus = 'online';
    } catch (error: any) {
      connectionInfo.checks[1].status = 'error';
      connectionInfo.checks[1].error = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
      connectionInfo.serverStatus = 'unknown';
    }
    connectionInfo.checks[1].endTime = new Date().toISOString();
    
    // Check 3: Try the auth login endpoint
    connectionInfo.checks.push({
      name: 'Auth Login Endpoint',
      endpoint: '/api/auth/login',
      method: 'GET',
      startTime: new Date().toISOString(),
      status: 'pending'
    });
    
    try {
      // Just check if the endpoint exists without sending credentials
      const authEndpointResponse = await axios.get(`${API_BASE_URL}/api/auth/login`, {
        validateStatus: (status) => status < 500 // Allow 4xx responses
      });
      
      // Even 401 or 405 means the endpoint exists
      connectionInfo.checks[2].status = 'success';
      connectionInfo.checks[2].statusCode = authEndpointResponse.status;
      connectionInfo.checks[2].message = 'Auth endpoint exists (returned ' + authEndpointResponse.status + ')';
    } catch (error: any) {
      connectionInfo.checks[2].status = 'error';
      connectionInfo.checks[2].error = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
    }
    connectionInfo.checks[2].endTime = new Date().toISOString();
    
    // Check 4: Try the tickets endpoint
    connectionInfo.checks.push({
      name: 'Tickets Endpoint',
      endpoint: '/api/tickets',
      method: 'GET',
      startTime: new Date().toISOString(),
      status: 'pending'
    });
    
    try {
      const ticketsResponse = await axios.get(`${API_BASE_URL}/api/tickets`, {
        validateStatus: (status) => status < 500, // Allow 4xx responses
        headers: { 
          // Add token if available
          ...(localStorage.getItem('token') 
            ? { Authorization: `Bearer ${localStorage.getItem('token')}` } 
            : {})
        }
      });
      
      // Even 401 is OK - it means the endpoint exists
      const endpointExists = ticketsResponse.status !== 404;
      connectionInfo.checks[3].status = endpointExists ? 'success' : 'error';
      connectionInfo.checks[3].statusCode = ticketsResponse.status;
      connectionInfo.checks[3].message = `Tickets endpoint ${endpointExists ? 'exists' : 'does not exist'} (${ticketsResponse.status})`;
      
      if (ticketsResponse.status === 200) {
        connectionInfo.checks[3].dataType = typeof ticketsResponse.data;
        connectionInfo.checks[3].dataStructure = Array.isArray(ticketsResponse.data) ? 
          'array' : typeof ticketsResponse.data;
      }
    } catch (error: any) {
      connectionInfo.checks[3].status = 'error';
      connectionInfo.checks[3].error = {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
    }
    connectionInfo.checks[3].endTime = new Date().toISOString();
    
    // Check 5: Try the root API endpoint
    connectionInfo.checks.push({
      name: 'Root API Check',
      endpoint: '/',
      method: 'GET',
      startTime: new Date().toISOString(),
      status: 'pending'
    });
    
    try {
      const rootResponse = await axios.get(`${API_BASE_URL}`, {
        validateStatus: (status) => status < 500 // Allow 4xx responses
      });
      
      connectionInfo.checks[4].status = 'success';
      connectionInfo.checks[4].statusCode = rootResponse.status;
      connectionInfo.checks[4].message = `Root API endpoint response: ${rootResponse.status}`;
    } catch (error: any) {
      connectionInfo.checks[4].status = 'error';
      connectionInfo.checks[4].error = {
        message: error.message,
        code: error.code
      };
    }
    connectionInfo.checks[4].endTime = new Date().toISOString();
    
    // Check if server appears to be running at all
    connectionInfo.summary = {
      serverRunning: connectionInfo.checks.some((c: any) => c.status === 'success'),
      authEndpointConfigured: false,
      ticketsEndpointConfigured: false,
      possibleIssues: []
    };
    
    // Check if auth appears to be properly configured
    const authEndpointExists = connectionInfo.checks[2].status === 'success';
    
    // Add summary
    connectionInfo.summary.authEndpointConfigured = authEndpointExists;
    connectionInfo.summary.ticketsEndpointConfigured = 
      connectionInfo.checks.some((c: any) => c.name === 'Tickets Endpoint' && c.status === 'success');
    
    // Add possible issues
    if (!connectionInfo.summary.serverRunning) {
      connectionInfo.summary.possibleIssues.push('Server does not appear to be running');
    }
    
    if (authEndpointExists && connectionInfo.checks[2].statusCode === 404) {
      connectionInfo.summary.possibleIssues.push('Auth endpoint not found - check backend routes configuration');
    }
    
    connectionInfo.endTime = new Date().toISOString();
    
    // Determine overall status
    if (!connectionInfo.summary.serverRunning) {
      connectionInfo.overallStatus = 'server_unreachable';
    } else if (connectionInfo.checks.every((c: any) => c.statusCode === 404)) {
      connectionInfo.overallStatus = 'wrong_api_base_url';
    } else if (!connectionInfo.summary.authEndpointConfigured) {
      connectionInfo.overallStatus = 'auth_endpoint_missing';
    } else {
      connectionInfo.overallStatus = 'ok';
    }
    
    return connectionInfo;
  } catch (error: any) {
    connectionInfo.endTime = new Date().toISOString();
    connectionInfo.overallStatus = 'check_failed';
    connectionInfo.error = {
      message: error.message,
      stack: error.stack
    };
    return connectionInfo;
  }
};

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add token to requests if it exists
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/login', { username, password });
  return response.data;
};

export const createTicket = async (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Ticket> => {
  const formData = new FormData();
  
  // Add ticket data
  formData.append('title', ticketData.title);
  formData.append('description', ticketData.description);
  formData.append('requesterId', ticketData.requesterId);
  formData.append('department', ticketData.department);
  formData.append('chemicalConfig', JSON.stringify(ticketData.chemicalConfig));
  
  // Add files if they exist
  if (ticketData.attachments && ticketData.attachments instanceof FileList) {
    Array.from(ticketData.attachments).forEach(file => {
      formData.append('files', file);
    });
  }

  const response = await api.post<Ticket>('/api/tickets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// New function to get tickets without date filtering for debugging
export const getAllTicketsRaw = async (): Promise<any> => {
  console.log('Fetching all tickets raw for debugging');
  const debugInfo: any = {
    requestInfo: {},
    responseInfo: {},
    error: null,
    attempts: []
  };
  
  try {
    // Get auth token info
    const token = localStorage.getItem('token');
    debugInfo.requestInfo.auth = {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 10) + '...' : 'none'
    };
    
    // Try multiple variations of API calls to diagnose the issue
    
    // Attempt 1: Basic call without params
    console.log('DEBUG attempt 1: Basic call without params');
    debugInfo.attempts.push({ 
      name: 'Basic Call', 
      url: '/api/tickets',
      params: {},
      startTime: new Date().toISOString()
    });
    
    let response = await api.get('/api/tickets');
    
    debugInfo.attempts[0].response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      length: Array.isArray(response.data) ? response.data.length : null,
      data: response.data
    };
    debugInfo.attempts[0].endTime = new Date().toISOString();
    
    // Attempt 2: With pagination params only
    console.log('DEBUG attempt 2: With pagination params only');
    const params = {
      page: '1',
      limit: '100'
    };
    
    debugInfo.attempts.push({ 
      name: 'Pagination Only', 
      url: '/api/tickets',
      params,
      startTime: new Date().toISOString()
    });
    
    response = await api.get('/api/tickets', { params });
    
    debugInfo.attempts[1].response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      length: Array.isArray(response.data) ? response.data.length : null,
      data: response.data
    };
    debugInfo.attempts[1].endTime = new Date().toISOString();
    
    // Attempt 3: With modified date range (all time)
    console.log('DEBUG attempt 3: With all-time date range');
    const dateParams = {
      page: '1',
      limit: '100',
      startDate: '2020-01-01',
      endDate: new Date().toISOString()
    };
    
    debugInfo.attempts.push({ 
      name: 'All-Time Date Range', 
      url: '/api/tickets',
      params: dateParams,
      startTime: new Date().toISOString()
    });
    
    response = await api.get('/api/tickets', { params: dateParams });
    
    debugInfo.attempts[2].response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      length: Array.isArray(response.data) ? response.data.length : null,
      data: response.data
    };
    debugInfo.attempts[2].endTime = new Date().toISOString();
    
    // Return the combined debug info
    return {
      success: true,
      debugInfo,
      mainResponse: response.data
    };
  } catch (error: any) {
    console.error('Error in raw ticket fetch:', error);
    debugInfo.error = {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    };
    return { 
      success: false,
      error: error.message,
      debugInfo
    };
  }
};

export const getTickets = async (
  status?: TicketStatus,
  page = 1,
  limit = 10,
  dateRange?: { startDate: Date; endDate: Date }
) => {
  try {
    // Build query parameters
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (status) {
      params.status = status;
    }

    // Add date filter parameters if provided
    if (dateRange) {
      // Format dates as ISO strings and extract just the date part for consistency
      params.startDate = dateRange.startDate.toISOString().split('T')[0];
      
      // For end date, ensure we're capturing the full day by setting time to end of day
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      params.endDate = endDate.toISOString();
      
      console.log('API call with date range:', { 
        startDate: params.startDate, 
        endDate: params.endDate 
      });
    } else {
      console.log('API call with no date range provided');
    }

    const queryString = new URLSearchParams(params).toString();
    
    console.log(`Fetching tickets with params: ${queryString}`);
    const response = await api.get(`/api/tickets?${queryString}`);
    
    // Add more detailed logging
    console.log('API response type:', typeof response.data);
    console.log('API response keys:', Object.keys(response.data || {}));
    
    // Check if response has the expected structure
    if (response.data && response.data.tickets && Array.isArray(response.data.tickets)) {
      console.log(`Found ${response.data.tickets.length} tickets in response`);
      return response.data;
    } 
    
    // Handle case where response is directly an array of tickets
    if (Array.isArray(response.data)) {
      console.log(`Response is an array with ${response.data.length} tickets`);
      return {
        tickets: response.data,
        pagination: {
          page,
          limit,
          total: response.data.length,
          totalPages: Math.ceil(response.data.length / limit),
        }
      };
    }
    
    // Handle empty or unexpected response
    console.warn('Unexpected response format:', response.data);
    return {
      tickets: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    };
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Return empty data structure instead of throwing
    return {
      tickets: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      },
      error: error.message
    };
  }
};

export const updateTicketStatus = async (ticketId: string, status: string): Promise<Ticket> => {
  const response = await api.put<Ticket>(`/api/tickets/${ticketId}`, { status });
  return response.data;
};

export const updateTicket = async (ticketId: string, updateData: Partial<Ticket>): Promise<Ticket> => {
  const formData = new FormData();
  
  // Add basic ticket data if provided
  if (updateData.title) formData.append('title', updateData.title);
  if (updateData.description) formData.append('description', updateData.description);
  if (updateData.status) formData.append('status', updateData.status);
  if (updateData.department) formData.append('department', updateData.department);
  if (updateData.chemicalConfig) formData.append('chemicalConfig', JSON.stringify(updateData.chemicalConfig));
  
  // Add new files if they exist
  if (updateData.attachments && Array.isArray(updateData.attachments)) {
    updateData.attachments.forEach(file => {
      if (file instanceof File) {
        formData.append('files', file);
      }
    });
  }

  const response = await api.put<Ticket>(`/api/tickets/${ticketId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api; 