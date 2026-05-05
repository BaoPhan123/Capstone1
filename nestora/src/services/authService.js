import { axiosAuthClient } from '../lib/axios';

const authService = {
    register: async (userData) => {
        try {
            const response = await axiosAuthClient.post('/api/auth/register', {
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                name: userData.name,
                address: userData.address,
            });
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng ký thất bại',
            };
        }
    },

    verifyOtp: async (email, otp) => {
        try {
            const response = await axiosAuthClient.post('/api/auth/verify-otp', { email, otp });
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Xác thực OTP thất bại' };
        }
    },

    resendOtp: async (email) => {
        try {
            const response = await axiosAuthClient.post('/api/auth/resend-otp', { email });
            return { success: true, message: response.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Gửi lại OTP thất bại' };
        }
    },

    login: async (credentials) => {
        try {
            const response = await axiosAuthClient.post('/api/auth/login', credentials);

            const { access_token, refresh_token, user } = response.data;

            // Save tokens and user to localStorage
            localStorage.setItem('nestora_access_token', access_token);
            localStorage.setItem('nestora_refresh_token', refresh_token);
            localStorage.setItem('nestora_user', JSON.stringify(user));

            return {
                success: true,
                user,
                tokens: {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng nhập thất bại',
            };
        }
    },


    refreshToken: async () => {
        try {
            const refreshToken = localStorage.getItem('nestora_refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axiosAuthClient.post('/api/auth/refresh', {
                refresh_token: refreshToken,
            });

            const { access_token, refresh_token } = response.data;

            localStorage.setItem('nestora_access_token', access_token);
            localStorage.setItem('nestora_refresh_token', refresh_token);

            return {
                success: true,
                tokens: {
                    accessToken: access_token,
                    refreshToken: refresh_token,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Làm mới token thất bại',
            };
        }
    },


    logout: async () => {
        try {
            await axiosAuthClient.post('/api/auth/logout');

            // Clear all auth data
            localStorage.removeItem('nestora_access_token');
            localStorage.removeItem('nestora_refresh_token');
            localStorage.removeItem('nestora_user');

            return {
                success: true,
            };
        } catch (error) {
            // Clear data even if API call fails
            localStorage.removeItem('nestora_access_token');
            localStorage.removeItem('nestora_refresh_token');
            localStorage.removeItem('nestora_user');

            return {
                success: true,
            };
        }
    },


    getMe: async () => {
        try {
            const response = await axiosAuthClient.get('/api/auth/me');

            // Update user in localStorage
            localStorage.setItem('nestora_user', JSON.stringify(response.data));

            return {
                success: true,
                user: response.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy thông tin thất bại',
            };
        }
    },


    isAuthenticated: () => {
        const token = localStorage.getItem('nestora_access_token');
        const user = localStorage.getItem('nestora_user');
        return !!(token && user);
    },

    getCurrentUser: () => {
        try {
            const userStr = localStorage.getItem('nestora_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },
};

export default authService;
