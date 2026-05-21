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
