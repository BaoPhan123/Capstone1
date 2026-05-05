import { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Camera,
    Lock,
    Bell,
    Shield,
    Save,
    Eye,
    EyeOff,
    Check,
    X
} from 'lucide-react';

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [profileData, setProfileData] = useState({
        name: 'Admin Nestora',
        email: 'admin@nestora.vn',
        phone: '0901234567',
        address: 'Văn phòng Nestora, Quận 1, TP.HCM',
        bio: 'Quản trị viên hệ thống Nestora',
        avatar: '/images/AnhCat/logo.png'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [notifications, setNotifications] = useState({
        emailOrders: true,
        emailNews: false,
        emailSecurity: true,
        pushOrders: true,
        pushNews: true,
        pushSecurity: true
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        console.log('Saving profile:', profileData);
        // Save logic here
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        console.log('Changing password');
        // Password change logic here
    };

    const handleNotificationChange = (key) => {
        setNotifications({
            ...notifications,
            [key]: !notifications[key]
        });
    };

    const tabs = [
        { id: 'profile', label: 'Thông tin cá nhân', icon: User },
        { id: 'security', label: 'Bảo mật', icon: Lock },
        { id: 'notifications', label: 'Thông báo', icon: Bell }
    ];

    return (
        <div className="admin-profile">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Tài khoản của tôi</h1>
                    <p className="page-subtitle">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
                </div>
            </div>

            {/* Profile Content */}
            <div className="profile-container">
                {/* Profile Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            <img src={profileData.avatar} alt="Avatar" />
                            <button className="avatar-upload-btn">
                                <Camera size={16} />
                            </button>
                        </div>
                        <h3 className="profile-name">{profileData.name}</h3>
                        <span className="profile-role">
                            <Shield size={14} />
                            Quản trị viên
                        </span>
                    </div>

                    <nav className="profile-nav">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`profile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Profile Main Content */}
                <div className="profile-main">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="profile-tab">
                            <div className="tab-header">
                                <h2>Thông tin cá nhân</h2>
                                <p>Cập nhật thông tin cá nhân của bạn</p>
                            </div>

                            <form onSubmit={handleProfileSubmit} className="profile-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>
                                            <User size={16} />
                                            Họ và tên
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            placeholder="Nhập họ và tên"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <Mail size={16} />
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            placeholder="Nhập email"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <Phone size={16} />
                                            Số điện thoại
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <MapPin size={16} />
                                            Địa chỉ
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            placeholder="Nhập địa chỉ"
                                        />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Giới thiệu bản thân</label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            placeholder="Viết vài dòng giới thiệu về bạn..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-secondary">
                                        Hủy thay đổi
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        <Save size={16} />
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="security-tab">
                            <div className="tab-header">
                                <h2>Bảo mật</h2>
                                <p>Quản lý mật khẩu và bảo mật tài khoản</p>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="security-form">
                                <div className="form-section">
                                    <h3>Đổi mật khẩu</h3>
                                    <div className="form-grid single">
                                        <div className="form-group">
                                            <label>Mật khẩu hiện tại</label>
                                            <div className="password-input">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    placeholder="Nhập mật khẩu hiện tại"
                                                />
                                                <button
                                                    type="button"
                                                    className="toggle-password"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                >
                                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Mật khẩu mới</label>
                                            <div className="password-input">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                    placeholder="Nhập mật khẩu mới"
                                                />
                                                <button
                                                    type="button"
                                                    className="toggle-password"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                >
                                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            <div className="password-requirements">
                                                <p>Mật khẩu phải có:</p>
                                                <ul>
                                                    <li className={passwordData.newPassword.length >= 8 ? 'valid' : ''}>
                                                        {passwordData.newPassword.length >= 8 ? <Check size={14} /> : <X size={14} />}
                                                        Ít nhất 8 ký tự
                                                    </li>
                                                    <li className={/[A-Z]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                                        {/[A-Z]/.test(passwordData.newPassword) ? <Check size={14} /> : <X size={14} />}
                                                        Ít nhất 1 chữ hoa
                                                    </li>
                                                    <li className={/[0-9]/.test(passwordData.newPassword) ? 'valid' : ''}>
                                                        {/[0-9]/.test(passwordData.newPassword) ? <Check size={14} /> : <X size={14} />}
                                                        Ít nhất 1 số
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Xác nhận mật khẩu mới</label>
                                            <div className="password-input">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordData.confirmPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                />
                                                <button
                                                    type="button"
                                                    className="toggle-password"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                                <span className="error-text">Mật khẩu không khớp</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn-primary">
                                        <Lock size={16} />
                                        Đổi mật khẩu
                                    </button>
                                </div>
                            </form>

                            {/* Security Info */}
                            <div className="security-info">
                                <h3>Hoạt động đăng nhập</h3>
                                <div className="login-activity">
                                    <div className="activity-item">
                                        <div className="activity-icon">
                                            <Shield size={20} />
                                        </div>
                                        <div className="activity-info">
                                            <span className="activity-device">Windows - Chrome</span>
                                            <span className="activity-location">TP.HCM, Việt Nam</span>
                                        </div>
                                        <div className="activity-time">
                                            <span className="current-badge">Hiện tại</span>
                                            <span>Hôm nay, 09:30</span>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon">
                                            <Shield size={20} />
                                        </div>
                                        <div className="activity-info">
                                            <span className="activity-device">iPhone - Safari</span>
                                            <span className="activity-location">TP.HCM, Việt Nam</span>
                                        </div>
                                        <div className="activity-time">
                                            <span>Hôm qua, 18:45</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="notifications-tab">
                            <div className="tab-header">
                                <h2>Thông báo</h2>
                                <p>Quản lý cách bạn nhận thông báo</p>
                            </div>

                            <div className="notification-settings">
                                <div className="notification-section">
                                    <h3>
                                        <Mail size={18} />
                                        Thông báo Email
                                    </h3>
                                    <div className="notification-items">
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <span className="notification-title">Đơn hàng mới</span>
                                                <span className="notification-desc">Nhận email khi có đơn hàng mới</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.emailOrders}
                                                    onChange={() => handleNotificationChange('emailOrders')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <span className="notification-title">Tin tức & Khuyến mãi</span>
                                                <span className="notification-desc">Nhận email về tin tức và khuyến mãi</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.emailNews}
                                                    onChange={() => handleNotificationChange('emailNews')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <span className="notification-title">Cảnh báo bảo mật</span>
                                                <span className="notification-desc">Nhận email khi có hoạt động đáng ngờ</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.emailSecurity}
                                                    onChange={() => handleNotificationChange('emailSecurity')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="notification-section">
                                    <h3>
                                        <Bell size={18} />
                                        Thông báo đẩy
                                    </h3>
                                    <div className="notification-items">
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <span className="notification-title">Đơn hàng mới</span>
                                                <span className="notification-desc">Nhận thông báo khi có đơn hàng mới</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.pushOrders}
                                                    onChange={() => handleNotificationChange('pushOrders')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <span className="notification-title">Tin tức & Cập nhật</span>
                                                <span className="notification-desc">Nhận thông báo về các cập nhật mới</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.pushNews}
                                                    onChange={() => handleNotificationChange('pushNews')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <span className="notification-title">Cảnh báo bảo mật</span>
                                                <span className="notification-desc">Nhận thông báo về các hoạt động bảo mật</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifications.pushSecurity}
                                                    onChange={() => handleNotificationChange('pushSecurity')}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="btn-primary">
                                    <Save size={16} />
                                    Lưu cài đặt
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
