import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on a login page
      // This prevents redirect loops and 404 errors
      if (!window.location.pathname.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'user' | 'owner';
    otp: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () => api.get('/auth/me'),

  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    profileImage?: string;
  }) => api.put('/auth/profile', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.put('/auth/change-password', data),

  // New OTP endpoints
  sendOTP: (data: { email: string; purpose: 'verification' | 'reset' }) =>
    api.post('/auth/send-otp', data),

  verifyOTP: (data: { email: string; otp: string; purpose: 'verification' | 'reset' }) =>
    api.post('/auth/verify-otp', data),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};

// Venues API
export const venuesAPI = {
  getAll: (params?: {
    sport?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }) => api.get('/venues', { params }),

  getById: (id: string) => api.get(`/venues/${id}`),

  create: (data: {
    name: string;
    description: string;
    location: string;
    address: string;
    latitude?: number;
    longitude?: number;
    images: string[];
    amenities: string[];
    openingHours: Record<string, any>;
  }) => api.post('/venues', data),

  update: (id: string, data: any) => api.put(`/venues/${id}`, data),

  delete: (id: string) => api.delete(`/venues/${id}`),

  getTimeSlots: (venueId: string, courtId: string, date: string) =>
    api.get(`/venues/${venueId}/courts/${courtId}/slots`, {
      params: { date },
    }),

  getStats: () => api.get('/venues/stats'),
};

// Courts API
export const courtsAPI = {
  create: (venueId: string, data: {
    name: string;
    sportId: string;
    description?: string;
    pricePerHour: number;
  }) => api.post(`/venues/${venueId}/courts`, data),

  update: (venueId: string, courtId: string, data: any) =>
    api.put(`/venues/${venueId}/courts/${courtId}`, data),

  delete: (venueId: string, courtId: string) =>
    api.delete(`/venues/${venueId}/courts/${courtId}`),
};



// Payments API
export const paymentsAPI = {
  createIntent: (bookingId: string) =>
    api.post('/payments/create-intent', { bookingId }),

  confirm: (paymentIntentId: string) =>
    api.post('/payments/confirm', { paymentIntentId }),
};

// Admin API
export const adminAPI = {
  getPendingVenues: () => api.get('/admin/venues/pending'),
  approveVenue: (id: string, approved: boolean, feedback?: string) => 
    api.put(`/admin/venues/${id}/approve`, { approved, feedback }),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id: string, data: { isActive?: boolean; role?: string }) => 
    api.put(`/admin/users/${id}`, data),
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
};

// Owner API
export const ownerAPI = {
  getVenues: () => api.get('/owner/venues'),
  getCourts: (venueId: string) => api.get(`/owner/venues/${venueId}/courts`),
  getCourtSlots: (courtId: string) => api.get(`/owner/courts/${courtId}/slots`),
  saveCourtSlots: (courtId: string, slots: Array<{dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean; isMaintenance?: boolean;}>) =>
    api.post(`/owner/courts/${courtId}/slots/bulk`, { slots }),

  getBookings: (params?: {
    venueId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/owner/bookings', { params }),

  getDashboardStats: () => api.get('/owner/dashboard/stats'),
};

// Upload API
export const uploadAPI = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Bookings API
export const bookingsAPI = {
  create: (data: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    notes?: string;
  }) => api.post('/bookings', data),

  bulkCreate: (data: {
    courtId: string;
    date: string;
    slots: Array<{ startTime: string; endTime: string }>;
    notes?: string;
  }) => api.post('/bookings/bulk', data),

  getAll: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => api.get('/bookings', { params }),

  getById: (id: string) => api.get(`/bookings/${id}`),

  update: (id: string, data: any) => api.put(`/bookings/${id}`, data),

  cancel: (id: string) => api.put(`/bookings/${id}/cancel`),

  delete: (id: string) => api.delete(`/bookings/${id}`),

  updateStatus: (id: string, status: string) =>
    api.put(`/bookings/${id}/status`, { status }),
};

// Reviews API
export const reviewsAPI = {
  create: (data: {
    venueId: string;
    bookingId: string;
    rating: number;
    comment: string;
  }) => api.post('/reviews', data),

  getByVenue: (venueId: string) => api.get(`/venues/${venueId}/reviews`),

  update: (id: string, data: { rating?: number; comment?: string }) =>
    api.put(`/reviews/${id}`, data),

  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Sports API
export const sportsAPI = {
  getAll: () => api.get('/sports'),
};

// Teams API
export const teamsAPI = {
  create: (data: {
    name: string;
    description?: string;
    logo?: string;
  }) => api.post('/teams', data),

  getAll: () => api.get('/teams'),

  getById: (id: string) => api.get(`/teams/${id}`),

  update: (id: string, data: any) => api.put(`/teams/${id}`, data),

  addMember: (teamId: string, userId: string, role?: string) =>
    api.post(`/teams/${teamId}/members`, { userId, role }),

  removeMember: (teamId: string, userId: string) =>
    api.delete(`/teams/${teamId}/members/${userId}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
