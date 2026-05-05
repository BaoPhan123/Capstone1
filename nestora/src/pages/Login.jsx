import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '', user: null });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setNotification({ show: false, type: '', message: '', user: null });

        // Call API login
        const result = await login({
            email: formData.email,
            password: formData.password
        });

        setIsLoading(false);

        if (result.success) {
            // Check if user has admin role
            if (result.user.roles && result.user.roles.includes('admin')) {
                navigate('/admin');
            } else {
                // User: show success notification and stay on page (will show avatar in header)
                const roleText = result.user.roles?.includes('customer') ? 'Khách hàng' : 'Người dùng';
                setNotification({
                    show: true,
                    type: 'success',
                    message: `Đăng nhập thành công! Xin chào ${result.user.name || result.user.email}`,
                    user: result.user,
                    roleText
                });
                // Redirect to home after 1.5 seconds
                setTimeout(() => {
                    navigate('/');
                }, 1500);
            }
        } else {
            setNotification({
                show: true,
                type: 'error',
                message: result.message || 'Đăng nhập thất bại',
                user: null
            });
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Notification Toast */}
                {notification.show && (
                    <div className={`login-notification ${notification.type}`}>
                        <div className="notification-icon">
                            {notification.type === 'success' ? (
                                <CheckCircle size={24} />
                            ) : (
                                <XCircle size={24} />
                            )}
                        </div>
                        <div className="notification-content">
                            <span className="notification-message">{notification.message}</span>
                            {notification.user && (
                                <div className="notification-user-info">
                                    <span className="user-role-badge">{notification.roleText}</span>
                                    <span className="user-email">{notification.user.email}</span>
                                </div>
                            )}
                        </div>
                        <button
                            className="notification-close"
                            onClick={() => setNotification({ show: false, type: '', message: '', user: null })}
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                )}

                <div className="auth-card">
                    {/* Left Side - Image/Brand */}
                    <div className="auth-brand">
                        <div className="brand-content">
                            <div className="brand-logo">
                                <span className="logo-icon-lg">N</span>
                                <span className="logo-text-lg">estora</span>
                            </div>
                            <h2>Chào mừng trở lại!</h2>
                            <p>Đăng nhập để trải nghiệm dịch vụ nội thất cao cấp cùng Nestora</p>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="auth-form-container">
                        <div className="auth-form-header">
                            <h1>Đăng nhập</h1>
                            <p>Nhập thông tin tài khoản của bạn</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-wrapper">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="example@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Mật khẩu</label>
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        placeholder="Nhập mật khẩu"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="checkbox-wrapper">
                                    <input type="checkbox" />
                                    <span>Ghi nhớ đăng nhập</span>
                                </label>
                                <Link to="/forgot-password" className="forgot-link">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn-auth-submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        <span>Đăng nhập</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>hoặc</span>
                        </div>

                        <p className="auth-switch">
                            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
