import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for saved user on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('nestora_user');
        const token = localStorage.getItem('nestora_access_token');

        if (savedUser && token) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                localStorage.removeItem('nestora_user');
                localStorage.removeItem('nestora_access_token');
                localStorage.removeItem('nestora_refresh_token');
            }
        }
        setIsLoading(false);
    }, []);

    // Register function
    const register = async (userData) => {
        try {
            const result = await authService.register(userData);

            if (result.success) {
                return {
                    success: true,
                    message: 'Đăng ký thành công!',
                };
            } else {
                return {
                    success: false,
                    message: result.message,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'Đã có lỗi xảy ra',
            };
        }
    };

    // Login function
    const login = async (credentials) => {
        try {
            const result = await authService.login(credentials);

            if (result.success) {
                setUser(result.user);
                return {
                    success: true,
                    user: result.user,
                };
            } else {
                return {
                    success: false,
                    message: result.message,
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'Đã có lỗi xảy ra',
            };
        }
    };

    // Logout function
    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    // Check if user has specific role
    const hasRole = (role) => {
        return user && user.roles && user.roles.includes(role);
    };

    // Check if user is admin
    const isAdmin = () => {
        return hasRole('admin');
    };

    // Check if user is logged in
    const isAuthenticated = () => {
        return user !== null;
    };

    // Refresh user data
    const refreshUser = async () => {
        const result = await authService.getMe();
        if (result.success) {
            const nextUser = result.user;
            setUser((prevUser) => {
                if (prevUser && JSON.stringify(prevUser) === JSON.stringify(nextUser)) {
                    return prevUser;
                }
                return nextUser;
            });
            localStorage.setItem('nestora_user', JSON.stringify(nextUser));
            return nextUser;
        }
        return null;
    };

    // Update user data in state + localStorage
    const updateUser = (userData) => {
        if (!userData) return;

        setUser((prevUser) => {
            const nextUser = {
                ...(prevUser || {}),
                ...userData
            };
            localStorage.setItem('nestora_user', JSON.stringify(nextUser));
            return nextUser;
        });
    };

    // Verify OTP function
    const verifyOtp = async (email, otp) => {
        return await authService.verifyOtp(email, otp);
    };

    // Resend OTP function
    const resendOtp = async (email) => {
        return await authService.resendOtp(email);
    };

    const value = {
        user,
        isLoading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        isAdmin,
        hasRole,
        isAuthenticated,
        refreshUser,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
