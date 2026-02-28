import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — handle 401 by clearing stale token and redirecting
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Only redirect if not already on login/signup page
                const path = window.location.pathname;
                if (!path.startsWith('/login') && !path.startsWith('/signup')) {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
