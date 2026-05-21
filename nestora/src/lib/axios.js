import axios from 'axios';

const baseURL = 'http://localhost:4000';

// Create axios instance
const axiosAuthClient = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const axiosInstance = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add token to requests
axiosAuthClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('nestora_access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
axiosAuthClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('nestora_refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // Try to refresh the token
                const response = await axiosInstance.post('/api/auth/refresh', {
                    refresh_token: refreshToken,
                });

                const { access_token, refresh_token } = response.data;

                // Save new tokens
                localStorage.setItem('nestora_access_token', access_token);
                localStorage.setItem('nestora_refresh_token', refresh_token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return axiosAuthClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed - clear tokens and redirect to login
                localStorage.removeItem('nestora_access_token');
                localStorage.removeItem('nestora_refresh_token');
                localStorage.removeItem('nestora_user');
                
                // Redirect to login page
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export { axiosAuthClient, axiosInstance };
