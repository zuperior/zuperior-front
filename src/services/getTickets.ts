import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export interface Ticket {
  id: number;
  ticket_no: string;
  parent_id: string;
  title: string;
  description?: string;
  ticket_type?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  account_number?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  last_reply_at?: string;
  closed_at?: string;
  closed_by?: string;
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  reply_id?: number;
  sender_id: string;
  sender_name: string;
  sender_type: string;
  content: string;
  is_internal: boolean;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  is_read: boolean;
}

export interface TicketWithReplies extends Ticket {
  replies: TicketReply[];
}

export interface GetTicketsParams {
  status?: string;
  ticket_type?: string;
  search?: string;
}

export interface GetTicketsResponse {
  success: boolean;
  data: Ticket[];
  count: number;
}

export interface GetTicketResponse {
  success: boolean;
  data: TicketWithReplies;
}

export interface CreateTicketParams {
  title: string;
  description?: string;
  ticket_type?: string;
  priority?: string;
  account_number?: string;
}

export interface CreateTicketResponse {
  success: boolean;
  message: string;
  data: Ticket;
}

export interface AddReplyParams {
  content: string;
  is_internal?: boolean;
}

export interface AddReplyResponse {
  success: boolean;
  message: string;
  data: TicketReply;
}

/**
 * Get all tickets for the authenticated user
 */
export async function getTickets(
  params: GetTicketsParams = {},
  access_token?: string
): Promise<Ticket[]> {
  try {
    // Get token from localStorage if not provided
    const token = access_token || (typeof window !== 'undefined' ? localStorage.getItem('userToken') : null);
    
    if (!token) {
      console.error('No access token available for fetching tickets');
      throw new Error('Authentication required');
    }

    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.ticket_type) queryParams.append('ticket_type', params.ticket_type);
    if (params.search) queryParams.append('search', params.search);

    const response = await axios.get<GetTicketsResponse>(
      `/api/support/tickets?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
}

/**
 * Get a single ticket by ID with its replies
 */
export async function getTicketById(
  ticketId: string | number,
  access_token?: string
): Promise<TicketWithReplies> {
  try {
    const token = access_token || (typeof window !== 'undefined' ? localStorage.getItem('userToken') : null);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get<GetTicketResponse>(
      `/api/support/tickets/${ticketId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
}

/**
 * Add a reply to a ticket
 */
export async function addTicketReply(
  ticketId: string | number,
  params: AddReplyParams,
  access_token?: string
): Promise<TicketReply> {
  try {
    const token = access_token || (typeof window !== 'undefined' ? localStorage.getItem('userToken') : null);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<AddReplyResponse>(
      `/api/support/tickets/${ticketId}/replies`,
      params,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
}

