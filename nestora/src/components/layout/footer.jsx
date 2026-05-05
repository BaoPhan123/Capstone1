import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { FaFacebookSquare, FaTwitterSquare, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
    const menuLinks = [
        { path: '/about', label: 'Giới thiệu' },
        { path: '/products', label: 'Sản phẩm' },
        { path: '/news', label: 'Tin tức' },
        { path: '/partners', label: 'Đối tác' },
        { path: '/contact', label: 'Liên hệ' },
    ];

    return (
        <footer className="w-full">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8">
                    {/* Company Info */}
                    <div className="md:col-span-2 lg:col-span-1">
                        <h5>THÔNG TIN CHUNG</h5>
                        <h4 className="mt-2 pt-2">CÔNG TY TNHH NESTORA</h4>
                        <p className="flex items-center gap-2">
                            <Phone size={16} />
                            <a href="tel:0999999999" title="0999.999.999">0999 999 999</a>
                        </p>
                        <p className="flex items-center gap-2">
                            <Mail size={16} />
                            <a href="mailto:cskh@nestora.vn" title="cskh@nestora.vn">cskh@nestora.vn</a>
                        </p>
                        <address className="flex items-start gap-2 not-italic">
                            <MapPin size={16} className="mt-1 flex-shrink-0" />
                            <span>Số 1, Nguyễn Trãi, Thanh Xuân, Hà Nội</span>
                        </address>
                    </div>

                    {/* About Us Links */}
                    <div>
                        <h5>VỀ CHÚNG TÔI</h5>
                        <ul className="menu-footer">
                            {menuLinks.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} title={link.label}>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h5>HỖ TRỢ KHÁCH HÀNG</h5>
                        <ul className="menu-footer">
                            <li><Link to="/payment-guide">Hướng dẫn thanh toán</Link></li>
                            <li><Link to="/shipping">Chính sách vận chuyển</Link></li>
                            <li><Link to="/return-policy">Chính sách đổi trả</Link></li>
                            <li><Link to="/warranty">Chính sách bảo hành</Link></li>
                            <li><Link to="/privacy">Chính sách bảo mật</Link></li>
                        </ul>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h5>KẾT NỐI VỚI CHÚNG TÔI</h5>
                        <div className="mt-4 social-icon flex gap-4">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <FaFacebookSquare size={30} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <FaTwitterSquare size={30} />
                            </a>
                            <a href="mailto:cskh@nestora.vn">
                                <FaEnvelope size={30} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-600 py-4 text-center">
                    <p className="text-sm">
                        © {new Date().getFullYear()} Nestora. Tất cả quyền được bảo lưu.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
