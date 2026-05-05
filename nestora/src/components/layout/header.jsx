import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, LogOut, Settings, ShoppingBag, ShoppingCart, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// Logo Component
const Logo = () => (
    <div className="logo-brand">
        <span className="logo-icon">N</span>
        <span className="logo-text">estora</span>
    </div>
);

const Header = () => {
    const [isFixed, setIsFixed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const { user, isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();

    // Handle scroll for fixed header
    useEffect(() => {
        const handleScroll = () => {
            setIsFixed(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { path: '/', label: 'Trang chủ' },
        { path: '/about', label: 'Giới thiệu' },
        { path: '/products', label: 'Sản phẩm' },
        { path: '/news', label: 'Tin tức' },
        { path: '/partners', label: 'Đối tác' },
       
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
    };

    return (
        <>
            <header className={isFixed ? 'fixed' : ''}>
                <nav className="container mx-auto px-4 flex justify-between items-center">
                    <div className="logo">
                        <Link to="/">
                            <Logo />
                        </Link>
                    </div>

                    <div className={`menu ${isMobileMenuOpen ? 'active' : ''}`} data-show="0">
                        <div className="flex h-full justify-center items-center">
                            <ul>
                                {menuItems.map((item) => (
                                    <li
                                        key={item.path}
                                        className={location.pathname === item.path ? 'active' : ''}
                                    >
                                        <Link to={item.path}>{item.label}</Link>
                                    </li>
                                ))}
                            </ul>

                            {/* Auth Buttons or User Avatar */}
                            {isAuthenticated() && user ? (
                                <div className="user-actions-wrapper">
                                    {/* Cart Icon */}
                                    {user.role !== 'admin' && (
                                        <Link to="/cart" className="cart-icon-btn">
                                            <ShoppingCart size={22} />
                                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                        </Link>
                                    )}

                                    <div className="user-dropdown-wrapper" ref={dropdownRef}>
                                        <button
                                            className="user-avatar-btn"
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            <div className="user-avatar-header">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} alt={user.name || user.email} />
                                                ) : (
                                                    <span>{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <span className="user-name-header">{user?.name}</span>
                                            <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isDropdownOpen && (
                                            <div className="user-dropdown-menu">
                                                <div className="dropdown-header">
                                                    <div className="dropdown-user-info">
                                                        <span className="dropdown-user-name">{user.name}</span>
                                                        <span className="dropdown-user-email">{user.email}</span>
                                                    </div>
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                                    <User size={16} />
                                                    <span>Tài khoản của tôi</span>
                                                </Link>
                                                <Link to="/orders" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                                    <ShoppingBag size={16} />
                                                    <span>Đơn hàng</span>
                                                </Link>
                                                <div className="dropdown-divider"></div>
                                                <button className="dropdown-item logout" onClick={handleLogout}>
                                                    <LogOut size={16} />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className="btn-login">
                                        <LogIn size={16} />
                                        <span>Đăng nhập</span>
                                    </Link>
                                    <Link to="/register" className="btn-register">
                                        <User size={16} />
                                        <span>Đăng ký</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center lg:hidden">
                        <button
                            className={`res-menu block lg:hidden ${isMobileMenuOpen ? 'active' : ''}`}
                            onClick={toggleMobileMenu}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </nav>
            </header>
        </>
    );
};

export default Header;
