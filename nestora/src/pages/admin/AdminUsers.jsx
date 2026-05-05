import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    MoreVertical,
    Download,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    ShoppingBag,
    Ban,
    CheckCircle,
    Lock,
    Unlock,
    Key
} from 'lucide-react';
import adminUserService from '../../services/adminUserService';
import { toast } from 'sonner';

// User Detail Modal
const UserDetailModal = ({ isOpen, onClose, user, onRefresh }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userDetail, setUserDetail] = useState(null);
    const [showOrders, setShowOrders] = useState(false);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadUserDetail();
        }
    }, [isOpen, user]);

    const loadUserDetail = async () => {
        setIsLoading(true);
        const result = await adminUserService.getUserDetail(user._id);
        if (result.success) {
            setUserDetail(result.data);
        } else {
            toast.error(result.message);
        }
        setIsLoading(false);
    };

    const loadUserOrders = async () => {
        if (!user) return;
        setOrdersLoading(true);
        const result = await adminUserService.getUserOrders({
            id: user._id,
            page: 1,
            limit: 5
        });
        if (result.success) {
            setOrders(result.data);
        } else {
            toast.error(result.message);
        }
        setOrdersLoading(false);
    };

    const handleToggleStatus = async () => {
        const newStatus = userDetail.user.status === 'active' ? 'blocked' : 'active';
        const result = await adminUserService.updateUserStatus(user._id, newStatus);
        if (result.success) {
            toast.success('Cập nhật trạng thái thành công');
            loadUserDetail();
            if (onRefresh) onRefresh();
        } else {
            toast.error(result.message);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container user-detail-modal">
                <div className="modal-header">
                    <h2>Thông tin người dùng</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                    ) : userDetail ? (
                        <>
                            <div className="user-profile-header">
                                <div className="user-avatar-large">
                                    <img src={'/images/AnhCat/logo.png'} alt={userDetail.user.name} />
                                </div>
                                <div className="user-profile-info">
                                    <h3>{userDetail.user.name}</h3>
                                    <span className={`role-badge ${userDetail.user.roles[0]}`}>
                                        {userDetail.user.roles.includes('admin') ? 'Quản trị viên' : 'Khách hàng'}
                                    </span>
                                    <span className={`status-badge ${userDetail.user.status}`}>
                                        {userDetail.user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                                    </span>
                                </div>
                            </div>

                            <div className="user-details-grid">
                                <div className="detail-item">
                                    <Mail size={18} />
                                    <div>
                                        <span className="label">Email</span>
                                        <span className="value">{userDetail.user.email}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <Phone size={18} />
                                    <div>
                                        <span className="label">Số điện thoại</span>
                                        <span className="value">{userDetail.user.phone || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <MapPin size={18} />
                                    <div>
                                        <span className="label">Địa chỉ</span>
                                        <span className="value">{userDetail.user.address || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <Calendar size={18} />
                                    <div>
                                        <span className="label">Ngày đăng ký</span>
                                        <span className="value">
                                            {new Date(userDetail.user.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <Calendar size={18} />
                                    <div>
                                        <span className="label">Cập nhật lần cuối</span>
                                        <span className="value">
                                            {new Date(userDetail.user.updatedAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {userDetail.stats && (
                                <div className="user-stats-row">
                                    <div className="user-stat">
                                        <ShoppingBag size={24} />
                                        <div>
                                            <span className="stat-value">{userDetail.stats.totalOrders}</span>
                                            <span className="stat-label">Tổng đơn hàng</span>
                                        </div>
                                    </div>
                                    <div className="user-stat">
                                        <CheckCircle size={24} />
                                        <div>
                                            <span className="stat-value">{userDetail.stats.completedOrders}</span>
                                            <span className="stat-label">Đã hoàn thành</span>
                                        </div>
                                    </div>
                                    <div className="user-stat">
                                        <div>
                                            <span className="stat-value">
                                                {userDetail.stats.totalSpent?.toLocaleString('vi-VN')}đ
                                            </span>
                                            <span className="stat-label">Tổng chi tiêu</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {userDetail.preferences?.favoriteDishes?.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <h4>Món ăn yêu thích</h4>
                                    <div className="favorite-dishes">
                                        {userDetail.preferences.favoriteDishes.slice(0, 3).map(dish => (
                                            <div key={dish._id} className="dish-item">
                                                <img src={dish.thumbnail} alt={dish.name} />
                                                <span>{dish.name}</span>
                                                <span>{dish.price?.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowOrders(!showOrders);
                                        if (!showOrders && orders.length === 0) {
                                            loadUserOrders();
                                        }
                                    }}
                                >
                                    {showOrders ? 'Ẩn đơn hàng' : 'Xem đơn hàng'}
                                </button>

                                {showOrders && (
                                    <div style={{ marginTop: '1rem' }}>
                                        {ordersLoading ? (
                                            <div>Đang tải đơn hàng...</div>
                                        ) : orders.length > 0 ? (
                                            <div className="orders-list">
                                                {orders.map(order => (
                                                    <div key={order._id} className="order-item">
                                                        <div>
                                                            <strong>#{order._id.slice(-6)}</strong>
                                                            <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <div>
                                                            <span className={`status-badge status-${order.status}`}>
                                                                {order.status}
                                                            </span>
                                                            <strong>{order.totalAmount?.toLocaleString('vi-VN')}đ</strong>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div>Chưa có đơn hàng nào</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
                <div className="modal-footer">
                    <button
                        className={userDetail?.user.status === 'active' ? 'btn-danger' : 'btn-success'}
                        onClick={handleToggleStatus}
                        disabled={isLoading}
                    >
                        {userDetail?.user.status === 'active' ? (
                            <><Lock size={16} /> Khóa tài khoản</>
                        ) : (
                            <><Unlock size={16} /> Mở khóa</>
                        )}
                    </button>
                    <button className="btn-secondary" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

// User Form Modal
const UserFormModal = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState(user || {
        name: '',
        email: '',
        phone: '',
        address: '',
        roles: ['customer'],
        status: 'active',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                roles: user.roles || ['customer'],
                status: user.status || 'active',
            });
        }
    }, [user]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await adminUserService.updateUser(user._id, formData);
            if (result.success) {
                toast.success(result.message);
                onSave();
                onClose();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container user-form-modal">
                <div className="modal-header">
                    <h2>Chỉnh sửa người dùng</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Họ và tên *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nhập họ và tên"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Nhập email"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                        <div className="form-group">
                            <label>Địa chỉ</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Nhập địa chỉ"
                            />
                        </div>
                        <div className="form-group">
                            <label>Vai trò</label>
                            <select
                                value={formData.roles[0]}
                                onChange={(e) => setFormData({ ...formData, roles: [e.target.value] })}
                            >
                                <option value="customer">Khách hàng</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Trạng thái</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Hoạt động</option>
                                <option value="blocked">Bị khóa</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminUsers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [statistics, setStatistics] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        loadUsers();
        loadStatistics();
    }, [currentPage, roleFilter, statusFilter, searchTerm]);

    const loadUsers = async () => {
        setLoading(true);
        const params = {
            page: currentPage,
            limit: 20,
        };

        if (statusFilter) params.status = statusFilter;
        if (roleFilter) params.role = roleFilter;
        if (searchTerm) params.search = searchTerm;

        const result = await adminUserService.getUsers(params);
        if (result.success) {
            setUsers(result.data);
            setPagination(result.pagination);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    const loadStatistics = async () => {
        const result = await adminUserService.getUserStatistics();
        if (result.success) {
            setStatistics(result.data.summary);
        }
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsFormModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Bạn có chắc chắn muốn khóa tài khoản này?')) return;

        const result = await adminUserService.blockUser(userId);
        if (result.success) {
            toast.success(result.message);
            loadUsers();
            loadStatistics();
        } else {
            toast.error(result.message);
        }
    };

    const handleExportUsers = async () => {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (roleFilter) params.role = roleFilter;

        const result = await adminUserService.exportUsers(params);
        if (result.success) {
            // Convert to CSV and download
            const csv = convertToCSV(result.data);
            downloadCSV(csv, 'users-export.csv');
            toast.success('Export dữ liệu thành công');
        } else {
            toast.error(result.message);
        }
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        return [headers, ...rows].join('\n');
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedUsers.length === 0) {
            toast.error('Vui lòng chọn ít nhất một người dùng');
            return;
        }

        const result = await adminUserService.bulkUpdateStatus(selectedUsers, status);
        if (result.success) {
            toast.success(result.message);
            setSelectedUsers([]);
            loadUsers();
            loadStatistics();
        } else {
            toast.error(result.message);
        }
    };

    const toggleSelectUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u._id));
        }
    };

    // User stats
    const userStats = [
        {
            label: 'Tổng người dùng',
            value: statistics?.totalUsers || 0,
            icon: User,
            color: 'blue'
        },
        {
            label: 'Hoạt động',
            value: statistics?.activeUsers || 0,
            icon: CheckCircle,
            color: 'green'
        },
        {
            label: 'Quản trị viên',
            value: statistics?.adminUsers || 0,
            icon: Shield,
            color: 'purple'
        },
        {
            label: 'Bị khóa',
            value: statistics?.blockedUsers || 0,
            icon: Ban,
            color: 'red'
        }
    ];

    return (
        <div className="admin-users">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Quản lý người dùng</h1>
                    <p className="page-subtitle">Quản lý tất cả tài khoản người dùng trong hệ thống</p>
                </div>
                <div className="page-header-actions">
                
                    {selectedUsers.length > 0 && (
                        <>
                            <button
                                className="btn-success"
                                onClick={() => handleBulkStatusUpdate('active')}
                            >
                                <Unlock size={18} />
                                Mở khóa ({selectedUsers.length})
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => handleBulkStatusUpdate('blocked')}
                            >
                                <Lock size={18} />
                                Khóa ({selectedUsers.length})
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* User Stats */}
            <div className="user-stats-grid">
                {userStats.map((stat, index) => (
                    <div key={index} className={`user-stat-card ${stat.color}`}>
                        <div className="stat-icon-wrapper">
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className="stat-label">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-select"
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="customer">Khách hàng</option>
                        <option value="admin">Quản trị viên</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-select"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="blocked">Bị khóa</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="table-card">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={selectedUsers.length === users.length && users.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>Người dùng</th>
                                        <th>Số điện thoại</th>
                                        <th>Địa chỉ</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày đăng ký</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox"
                                                    checked={selectedUsers.includes(user._id)}
                                                    onChange={() => toggleSelectUser(user._id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar">
                                                        <span>{user.name?.charAt(0) || 'U'}</span>
                                                    </div>
                                                    <div className="user-info">
                                                        <span className="user-name">{user.name}</span>
                                                        <span className="user-email">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{user.phone || 'Chưa cập nhật'}</td>
                                            <td>{user.address || 'Chưa cập nhật'}</td>
                                            <td>
                                                <span className={`role-badge ${user.roles[0]}`}>
                                                    {user.roles.includes('admin') ? (
                                                        <>
                                                            <Shield size={14} />
                                                            Quản trị viên
                                                        </>
                                                    ) : (
                                                        <>
                                                            <User size={14} />
                                                            Khách hàng
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${user.status === 'active' ? 'status-active' : 'status-blocked'}`}>
                                                    {user.status === 'active' ? (
                                                        <>
                                                            <CheckCircle size={14} />
                                                            Hoạt động
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban size={14} />
                                                            Bị khóa
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="date-cell">
                                                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn view"
                                                        title="Xem chi tiết"
                                                        onClick={() => handleViewUser(user)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn edit"
                                                        title="Chỉnh sửa"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        title="Khóa"
                                                        onClick={() => handleDeleteUser(user._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="table-pagination">
                            <div className="pagination-info">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} người dùng
                            </div>
                            <div className="pagination-buttons">
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
                                    const pageNum = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
                                    if (pageNum > pagination.pages) return null;
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === pagination.pages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <UserDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                user={selectedUser}
                onRefresh={loadUsers}
            />
            <UserFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                user={selectedUser}
                onSave={loadUsers}
            />
        </div>
    );
};

export default AdminUsers;
