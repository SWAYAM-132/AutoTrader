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
        // We will implement token retrieval from localStorage or cookie here later
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

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors globally
        if (error.response && error.response.status === 401) {
            // specific logic for 401
        }
        return Promise.reject(error);
    }
);

export default api;
