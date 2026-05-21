import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, UserPlus, CheckCircle, XCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    const { register, verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (countdown > 0 && step === 2) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown, step]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setNotification({
                show: true,
                type: 'error',
                message: 'Mật khẩu xác nhận không khớp!'
            });
            return;
        }

        if (!agreeTerms) {
            setNotification({
                show: true,
                type: 'error',
                message: 'Vui lòng đồng ý với điều khoản sử dụng!'
            });
            return;
        }

        setIsLoading(true);
        setNotification({ show: false, type: '', message: '' });

        const result = await register({
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            password: formData.password,
            name: formData.fullName
        });

        setIsLoading(false);

        if (result.success) {
            setNotification({
                show: true,
                type: 'success',
                message: result.message || 'Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.'
            });
            setStep(2);
            setCountdown(60);
        } else {
            setNotification({
                show: true,
                type: 'error',
                message: result.message || 'Đăng ký thất bại'
            });
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setNotification({ show: true, type: 'error', message: 'Vui lòng nhập đủ 6 số OTP' });
            return;
        }

        setIsLoading(true);
        const result = await verifyOtp(formData.email, otp);
        setIsLoading(false);

        if (result.success) {
            setNotification({ show: true, type: 'success', message: 'Xác thực thành công! Đang chuyển hướng...' });
            setTimeout(() => navigate('/login'), 2000);
        } else {
            setNotification({ show: true, type: 'error', message: result.message });
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0) return;

        setIsLoading(true);
        const result = await resendOtp(formData.email);
        setIsLoading(false);

        if (result.success) {
            setNotification({ show: true, type: 'success', message: 'Mã OTP mới đã được gửi!' });
            setCountdown(60);
        } else {
            setNotification({ show: true, type: 'error', message: result.message });
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
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
                        </div>
                        <button
                            className="notification-close"
                            onClick={() => setNotification({ show: false, type: '', message: '' })}
                        >
                            <XCircle size={18} />
                        </button>
                    </div>
                )}

                <div className="auth-card">
                    <div className="auth-brand">
                        <div className="brand-content">
                            <div className="brand-logo">
                                <span className="logo-icon-lg">N</span>
                                <span className="logo-text-lg">estora</span>
                            </div>
                            <h2>Tham gia cùng chúng tôi!</h2>
                            <p>Đăng ký để trở thành thành viên và nhận nhiều ưu đãi hấp dẫn từ Nestora</p>
                            <ul className="benefits-list">
                                <li>✓ Giảm giá 10% cho đơn hàng đầu tiên</li>
                                <li>✓ Tích điểm đổi quà hấp dẫn</li>
                                <li>✓ Nhận thông báo khuyến mãi sớm nhất</li>
                                <li>✓ Tư vấn thiết kế miễn phí</li>
                            </ul>
                        </div>
                    </div>

                    <div className="auth-form-container flex-col p-4 md:p-8 justify-center relative overflow-hidden">
                        {step === 1 ? (
                            <div className="transition-all duration-300 transform">
                                <div className="auth-form-header">
                                    <h1>Đăng ký</h1>
                                    <p>Tạo tài khoản mới</p>
                                </div>

                                <form onSubmit={handleSubmit} className="auth-form">
                                    <div className="form-group">
                                        <label htmlFor="fullName">Họ và tên</label>
                                        <div className="input-wrapper">
                                            <User size={18} className="input-icon" />
                                            <input
                                                type="text"
                                                id="fullName"
                                                name="fullName"
                                                placeholder="Nguyễn Văn A"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
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
                                            <label htmlFor="phone">Số điện thoại</label>
                                            <div className="input-wrapper">
                                                <Phone size={18} className="input-icon" />
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    placeholder="0912 345 678"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="address">Địa chỉ</label>
                                            <div className="input-wrapper">
                                                <MapPin size={18} className="input-icon" />
                                                <input
                                                    type="text"
                                                    id="address"
                                                    name="address"
                                                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="password">Mật khẩu</label>
                                            <div className="input-wrapper">
                                                <Lock size={18} className="input-icon" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    name="password"
                                                    placeholder="Tối thiểu 8 ký tự"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    minLength={8}
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

                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                            <div className="input-wrapper">
                                                <Lock size={18} className="input-icon" />
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    placeholder="Nhập lại mật khẩu"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    minLength={8}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="toggle-password"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-options">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={agreeTerms}
                                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                            />
                                            <span>
                                                Tôi đồng ý với <Link to="/terms">Điều khoản sử dụng</Link> và{' '}
                                                <Link to="/privacy">Chính sách bảo mật</Link>
                                            </span>
                                        </label>
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
                                                <UserPlus size={18} />
                                                <span>Tiếp tục</span>
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="auth-divider">
                                    <span>hoặc đăng ký với</span>
                                </div>

                                <div className="social-login">
                                    <button className="btn-social btn-google">
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span>Google</span>
                                    </button>
                                    <button className="btn-social btn-facebook">
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                        <span>Facebook</span>
                                    </button>
                                </div>

                                <p className="auth-switch">
                                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                                </p>
                            </div>
                        ) : (
                            <div className="transition-all duration-300 transform scale-100 opacity-100 flex flex-col items-center justify-center text-center py-8">
                                <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-6 text-cyan-600 shadow-sm border border-cyan-100">
                                    <KeyRound size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Nhập mã xác nhận</h2>
                                <p className="text-sm text-gray-500 mb-8 max-w-sm">
                                    Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến email <br />
                                    <strong>{formData.email}</strong>
                                </p>

                                <form onSubmit={handleVerifyOtp} className="w-full max-w-sm">
                                    <div className="mb-6">
                                        <div className="flex justify-center space-x-2 lg:space-x-4">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="------"
                                                className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-gray-50 border border-gray-200 rounded-lg py-4 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all text-gray-700 placeholder-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || otp.length !== 6}
                                        className="w-full py-3.5 bg-[#bd945f] hover:bg-[#a67d4a] text-white font-semibold rounded-lg shadow-md shadow-[#bd945f]/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
                                    >
                                        {isLoading ? <span className="loading-spinner"></span> : 'Xác thực tài khoản'}
                                    </button>
                                </form>

                                <div className="text-sm text-gray-500">
                                    Chưa nhận được mã?{' '}
                                    {countdown > 0 ? (
                                        <span className="font-semibold text-gray-400 cursor-not-allowed">
                                            Gửi lại sau {countdown}s
                                        </span>
                                    ) : (
                                        <button
                                            onClick={handleResendOtp}
                                            disabled={isLoading}
                                            className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline transition-colors focus:outline-none"
                                        >
                                            Gửi lại mã
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="mt-8 text-sm flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <ArrowLeft size={16} /> Quay lại trang đăng ký
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
