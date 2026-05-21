import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    Settings,
    TrendingUp,
    Newspaper
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Admin Logo Component
const AdminLogo = ({ collapsed }) => (
    <div className="admin-logo">
        <span className="admin-logo-icon">N</span>
        {!collapsed && <span className="admin-logo-text">estora</span>}
    </div>
);

const AdminLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        {
            path: '/admin',
            label: 'Tổng quan',
            icon: LayoutDashboard,
            exact: true
        },
        {
            path: '/admin/products',
            label: 'Quản lý sản phẩm',
            icon: Package
        },
        {
            path: '/admin/orders',
            label: 'Quản lý đơn hàng',
            icon: ShoppingCart
        },
        {
            path: '/admin/users',
            label: 'Quản lý người dùng',
            icon: Users
        },
        {
            path: '/admin/news',
            label: 'Quản lý tin tức',
            icon: Newspaper
        },
        {
            path: '/admin/profile',
            label: 'Tài khoản',
            icon: UserCircle
        }
    ];

    const isActive = (item) => {
        if (item.exact) {
            return location.pathname === item.path;
        }
        return location.pathname.startsWith(item.path);
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const { logout } = useAuth();

    const handleLogout = () => {
        logout(); // Xóa trạng thái đăng nhập
        navigate('/'); // Chuyển về trang chủ
    };

    return (
        <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Overlay for mobile */}
            {mobileMenuOpen && (
                <div className="admin-overlay" onClick={toggleMobileMenu}></div>
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/admin" className="sidebar-logo-link">
                        <AdminLogo collapsed={sidebarCollapsed && !mobileMenuOpen} />
                    </Link>
                    <button className="sidebar-close-mobile" onClick={toggleMobileMenu}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`sidebar-menu-item ${isActive(item) ? 'active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    title={sidebarCollapsed ? item.label : ''}
                                >
                                    <item.icon className="menu-icon" size={20} />
                                    {(!sidebarCollapsed || mobileMenuOpen) && (
                                        <span className="menu-label">{item.label}</span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-menu-item logout-btn" onClick={handleLogout} title="Đăng xuất">
                        <LogOut className="menu-icon" size={20} />
                        {(!sidebarCollapsed || mobileMenuOpen) && (
                            <span className="menu-label">Đăng xuất</span>
                        )}
                    </button>
                    <button className="sidebar-toggle" onClick={toggleSidebar}>
                        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                {/* Top Header */}
                <header className="admin-header">
                    <div className="header-left">
                        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="header-right">
                        {/* Top-right admin profile removed as requested */}
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
