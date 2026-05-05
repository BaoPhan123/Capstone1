import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, X, ShoppingBag, Heart, Settings, Lock, ChevronRight, LogOut, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import { getImageUrl } from '../lib/utils';
import { toast } from 'sonner';

// Image paths từ public folder
const bannerSanPhamImg = '/images/AnhCat/banner-san-pham.png';

const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    // Favorites state
    const [favorites, setFavorites] = useState([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        birthday: '',
        gender: 'male'
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Fetch profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const result = await userService.getProfile();
                if (result.success && result.data?.user) {
                    const userData = result.data.user;
                    setFormData({
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        address: userData.address || '',
                        birthday: userData.birthday || '',
                        gender: userData.gender || 'male'
                    });
                } else {
                    // Fallback to auth context user
                    setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        address: user?.address || '',
                        gender: user?.gender || 'male'
                    });
                }
            } catch (err) {
                setError('Không thể tải thông tin profile');
                // Fallback to auth context user
                setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    address: user?.address || '',
                    gender: user?.gender || 'male'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    useEffect(() => {
        setError('');
        setErrors([]);
        setSuccessMessage('');
        if (activeTab === 'wishlist') {
            fetchFavorites();
        }
    }, [activeTab]);

    const fetchFavorites = async () => {
        setFavoritesLoading(true);
        const result = await userService.getPreferences();
        if (result.success && result.data?.favoriteDishes) {
            setFavorites(result.data.favoriteDishes);
        } else {
            setFavorites([]);
        }
        setFavoritesLoading(false);
    };

    const handleRemoveFavorite = async (productId) => {
        const result = await userService.removeFavoriteDish(productId);
        if (result.success) {
            setFavorites(prev => prev.filter(p => p._id !== productId));
            toast.success('Đã xóa khỏi danh sách yêu thích');
        } else {
            toast.error(result.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setErrors([]);
        setSuccessMessage('');

        try {
            const result = await userService.updateProfile({
                name: formData.name,
                phone: formData.phone,
                address: formData.address
            });

            if (result.success) {
                setIsEditing(false);
                setSuccessMessage('Cập nhật thông tin thành công!');
                if (updateUser && result.data) {
                    updateUser(result.data);
                }
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(result.message || 'Cập nhật thông tin thất bại');
                if (result.errors && Array.isArray(result.errors)) {
                    setErrors(result.errors);
                }
            }
        } catch (err) {
            if (err.response && err.response.data) {
                const data = err.response.data;
                setError(data.message || 'Có lỗi xảy ra khi cập nhật thông tin');
                if (data.errors && Array.isArray(data.errors)) {
                    setErrors(data.errors);
                }
            } else {
                setError('Có lỗi xảy ra khi cập nhật thông tin');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            setErrors([]);
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError('Mật khẩu mới phải có ít nhất 8 ký tự!');
            setErrors([]);
            return;
        }

        setChangingPassword(true);
        setError('');
        setErrors([]);
        setSuccessMessage('');

        try {
            const result = await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (result.success) {
                setSuccessMessage('Đổi mật khẩu thành công!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setError(result.message || 'Đổi mật khẩu thất bại');
                if (result.errors && Array.isArray(result.errors)) {
                    setErrors(result.errors);
                }
            }
        } catch (err) {
            if (err.response && err.response.data) {
                const data = err.response.data;
                setError(data.message || 'Có lỗi xảy ra khi đổi mật khẩu');
                if (data.errors && Array.isArray(data.errors)) {
                    setErrors(data.errors);
                }
            } else {
                setError('Có lỗi xảy ra khi đổi mật khẩu');
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const menuItems = [
        { id: 'info', icon: User, label: 'Thông tin cá nhân' },
        { id: 'orders', icon: ShoppingBag, label: 'Đơn hàng của tôi', link: '/orders' },
        { id: 'wishlist', icon: Heart, label: 'Sản phẩm yêu thích' },
        { id: 'password', icon: Lock, label: 'Đổi mật khẩu' },
        { id: 'settings', icon: Settings, label: 'Cài đặt' }
    ];

    return (
        <div>
            {/* Banner */}
            <section className="relative h-[300px] overflow-hidden">
                <img src={bannerSanPhamImg} alt="Tài khoản của tôi" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
                    <div className="container mx-auto px-4">
                        <h1 className="text-white text-4xl font-bold mb-4" style={{ fontFamily: 'Gotham-Ultra, sans-serif' }}>
                            Tài khoản của tôi
                        </h1>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Link to="/" className="hover:text-[#bd945f] transition-colors">Trang chủ</Link>
                            <ChevronRight size={16} />
                            <span className="text-[#bd945f]">Tài khoản</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Profile Content */}
            <section className="py-16 bg-[#f8f8f8]">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                        {/* Sidebar */}
                        <aside className="bg-white p-6 shadow-sm h-fit">
                            {/* Avatar */}
                            <div className="flex flex-col items-center pb-6 border-b border-gray-100 mb-6">
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#bd945f] to-[#d4a86a] flex items-center justify-center text-white">
                                        <User size={40} />
                                    </div>
                                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#bd945f] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#a67d4a] transition-colors">
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">{formData.name}</h3>
                                <p className="text-sm text-gray-500">{formData.email}</p>
                            </div>

                            {/* Menu */}
                            <nav className="space-y-1">
                                {menuItems.map(item => (
                                    item.link ? (
                                        <Link
                                            key={item.id}
                                            to={item.link}
                                            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-[#bd945f] transition-all"
                                        >
                                            <item.icon size={20} />
                                            <span className="flex-1">{item.label}</span>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </Link>
                                    ) : (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${activeTab === item.id
                                                ? 'bg-[#bd945f]/10 text-[#bd945f] font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-[#bd945f]'
                                                }`}
                                        >
                                            <item.icon size={20} />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </button>
                                    )
                                ))}
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-all mt-4"
                                >
                                    <LogOut size={20} />
                                    <span className="flex-1 text-left">Đăng xuất</span>
                                </button>
                            </nav>
                        </aside>

                        {/* Main Content */}
                        <main>
                            {/* Loading State */}
                            {loading && (
                                <div className="bg-white shadow-sm p-16 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-[#bd945f]" size={40} />
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
                                    <p className="font-medium">{error}</p>
                                    {errors.length > 0 && (
                                        <ul className="mt-2 space-y-1 text-sm">
                                            {errors.map((err, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-red-500 mt-0.5">•</span>
                                                    <span>{err.message}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Success Message */}
                            {successMessage && (
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded">
                                    {successMessage}
                                </div>
                            )}

                            {/* Personal Info Tab */}
                            {!loading && activeTab === 'info' && (
                                <div className="bg-white shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-xl font-semibold text-gray-800">Thông tin cá nhân</h2>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                            >
                                                <Edit2 size={16} />
                                                Chỉnh sửa
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                >
                                                    <X size={16} />
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                    {saving ? 'Đang lưu...' : 'Lưu'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Họ tên */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                    <User size={16} />
                                                    Họ và tên
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors"
                                                    />
                                                ) : (
                                                    <p className="px-4 py-3 bg-gray-50 text-gray-800">{formData.name}</p>
                                                )}
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                    <Mail size={16} />
                                                    Email
                                                </label>

                                                <p className="px-4 py-3 bg-gray-50 text-gray-800">{formData.email}</p>

                                            </div>

                                            {/* Số điện thoại */}
                                            <div>
                                                <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                    <Phone size={16} />
                                                    Số điện thoại
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors"
                                                    />
                                                ) : (
                                                    <p className="px-4 py-3 bg-gray-50 text-gray-800">{formData.phone}</p>
                                                )}
                                            </div>


                                            {/* Giới tính */}
                                            <div>
                                                <label className="text-sm text-gray-500 mb-2 block">Giới tính</label>
                                                {isEditing ? (
                                                    <select
                                                        name="gender"
                                                        value={formData.gender}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors bg-white"
                                                    >
                                                        <option value="male">Nam</option>
                                                        <option value="female">Nữ</option>
                                                        <option value="other">Khác</option>
                                                    </select>
                                                ) : (
                                                    <p className="px-4 py-3 bg-gray-50 text-gray-800">
                                                        {formData.gender === 'male' ? 'Nam' : formData.gender === 'female' ? 'Nữ' : 'Khác'}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Địa chỉ */}
                                            <div className="md:col-span-2">
                                                <label className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                    <MapPin size={16} />
                                                    Địa chỉ
                                                </label>
                                                {isEditing ? (
                                                    <textarea
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleChange}
                                                        rows={2}
                                                        className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors resize-none"
                                                    />
                                                ) : (
                                                    <p className="px-4 py-3 bg-gray-50 text-gray-800">{formData.address}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wishlist Tab */}
                            {!loading && activeTab === 'wishlist' && (
                                <div className="bg-white shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-xl font-semibold text-gray-800">Sản phẩm yêu thích</h2>
                                        {favorites.length > 0 && (
                                            <p className="text-sm text-gray-500 mt-1">{favorites.length} sản phẩm</p>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        {favoritesLoading ? (
                                            <div className="flex items-center justify-center py-16">
                                                <Loader2 className="animate-spin text-[#bd945f]" size={40} />
                                            </div>
                                        ) : favorites.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <Heart size={64} className="text-gray-300 mb-4" />
                                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có sản phẩm yêu thích</h3>
                                                <p className="text-gray-500 mb-6">Hãy khám phá và thêm sản phẩm vào danh sách yêu thích của bạn</p>
                                                <Link
                                                    to="/products"
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                                >
                                                    Khám phá sản phẩm
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {favorites.map(product => (
                                                    <div key={product._id} className="border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                                        <div className="relative overflow-hidden h-48">
                                                            <img
                                                                src={product.images && product.images[0] ? getImageUrl(product.images[0]) : '/images/AnhCat/sp-1.png'}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                            <button
                                                                onClick={() => handleRemoveFavorite(product._id)}
                                                                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors"
                                                                title="Xóa khỏi yêu thích"
                                                            >
                                                                <Trash2 size={14} className="text-red-400" />
                                                            </button>
                                                        </div>
                                                        <div className="p-4">
                                                            <span className="text-xs text-[#bd945f] uppercase tracking-wide">{product.category}</span>
                                                            <h3 className="font-semibold text-gray-800 mt-1 mb-2 line-clamp-2">
                                                                <Link to={`/products/${product._id}`} className="hover:text-[#bd945f] transition-colors">
                                                                    {product.name}
                                                                </Link>
                                                            </h3>
                                                            <p className="text-[#bd945f] font-semibold">
                                                                {product.price?.toLocaleString('vi-VN')} VNĐ
                                                            </p>
                                                            <Link
                                                                to={`/products/${product._id}`}
                                                                className="mt-3 block text-center py-2 bg-[#bd945f] text-white text-sm hover:bg-[#a67d4a] transition-colors"
                                                            >
                                                                Xem chi tiết
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Change Password Tab */}
                            {!loading && activeTab === 'password' && (
                                <div className="bg-white shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-xl font-semibold text-gray-800">Đổi mật khẩu</h2>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={handleChangePassword} className="max-w-md">
                                            <div className="mb-5">
                                                <label className="block text-sm text-gray-600 mb-2">Mật khẩu hiện tại</label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={passwordData.currentPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Nhập mật khẩu hiện tại"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="mb-5">
                                                <label className="block text-sm text-gray-600 mb-2">Mật khẩu mới</label>
                                                <input
                                                    type="password"
                                                    name="newPassword"
                                                    value={passwordData.newPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Nhập mật khẩu mới"
                                                    minLength={8}
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm text-gray-600 mb-2">Xác nhận mật khẩu mới</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={passwordData.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Nhập lại mật khẩu mới"
                                                    required
                                                    className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={changingPassword}
                                                className="flex items-center gap-2 px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors disabled:opacity-50"
                                            >
                                                {changingPassword ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                                                {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Settings Tab */}
                            {!loading && activeTab === 'settings' && (
                                <div className="bg-white shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-xl font-semibold text-gray-800">Cài đặt</h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {/* Email notifications */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50">
                                            <div>
                                                <h4 className="font-medium text-gray-800">Nhận thông báo email</h4>
                                                <p className="text-sm text-gray-500">Nhận email về đơn hàng và khuyến mãi</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bd945f]"></div>
                                            </label>
                                        </div>

                                        {/* SMS notifications */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50">
                                            <div>
                                                <h4 className="font-medium text-gray-800">Nhận thông báo SMS</h4>
                                                <p className="text-sm text-gray-500">Nhận SMS về trạng thái đơn hàng</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bd945f]"></div>
                                            </label>
                                        </div>

                                        {/* 2FA */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50">
                                            <div>
                                                <h4 className="font-medium text-gray-800">Xác thực hai yếu tố</h4>
                                                <p className="text-sm text-gray-500">Bảo mật tài khoản với xác thực 2 bước</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bd945f]"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProfilePage;
