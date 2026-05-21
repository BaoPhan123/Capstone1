import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Star,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Sofa,
    BedDouble,
    UtensilsCrossed,
    Bath,
    Baby,
    Monitor,
    Layers,
    Lamp
} from 'lucide-react';
import productService from '../services/productService';
import newsService from '../services/newsService';
import { getImageUrl } from '../lib/utils';
import { htmlToPlainText } from '../utils/text';

const bannerImg = '/images/AnhCat/banner.png';
const moneyImg = '/images/AnhCat/money.png';
const productImg = '/images/AnhCat/product.png';
const medalImg = '/images/AnhCat/medal.png';
const open24hImg = '/images/AnhCat/open-24-h.png';
const tintuc0Img = '/images/AnhCat/tintuc-0.png';
const vinpearlImg = '/images/vinpearl.png';
const muongthanhImg = '/images/muongthanh.png';
const sheratonImg = '/images/sheraton.png';
const tchImg = '/images/tch.png';
const marvellaImg = '/images/marvella.png';
const gheImg = '/images/AnhCat/ghe.png';
const lienheBgImg = '/images/AnhCat/lienhe-bg.jpg';

const categories = [
    { id: 1, name: 'PHÒNG KHÁCH', icon: Sofa },
    { id: 2, name: 'PHÒNG NGỦ', icon: BedDouble },
    { id: 3, name: 'PHÒNG BẾP', icon: UtensilsCrossed },
    { id: 4, name: 'PHÒNG TẮM', icon: Bath },
    { id: 5, name: 'TRẺ EM', icon: Baby },
    { id: 6, name: 'VĂN PHÒNG', icon: Monitor },
    { id: 7, name: 'CẦU THANG', icon: Layers },
    { id: 8, name: 'ĐÈN TRANG TRÍ', icon: Lamp },
];

const reasons = [
    { id: 1, title: 'Chính sách giá', desc: 'Tốt nhất và công khai giá trên website', icon: moneyImg },
    { id: 2, title: 'Sản xuất', desc: 'Trực tiếp sản xuất bởi đội ngũ nhân viên hàng đầu', icon: productImg },
    { id: 3, title: 'Chất lượng', desc: 'Cam kết chất lượng sản phẩm và tốc độ thi công', icon: medalImg },
    { id: 4, title: 'Bảo hành', desc: 'Dịch vụ bảo hành tốt nhất khu vực', icon: open24hImg },
];

const partners = [
    { id: 1, name: 'Vinpearl', image: vinpearlImg },
    { id: 2, name: 'Mường Thanh', image: muongthanhImg },
    { id: 3, name: 'Sheraton', image: sheratonImg },
    { id: 4, name: 'TCH', image: tchImg },
    { id: 5, name: 'Marvella', image: marvellaImg },
];

const HomePage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [contactEmail, setContactEmail] = useState('');
    const [products, setProducts] = useState([]);
    const [news, setNews] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isLoadingNews, setIsLoadingNews] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            const result = await productService.getAllProducts();
            if (result.success) {
                const formattedProducts = result.data.slice(0, 8).map(p => ({
                    id: p._id,
                    name: p.name,
                    desc: htmlToPlainText(p.desc || p.description),
                    price: p.price.toLocaleString('vi-VN'),
                    image: getImageUrl(p.images && p.images[0] ? p.images[0] : p.image)
                }));
                setProducts(formattedProducts);
            }
            setIsLoadingProducts(false);
        };

        const fetchNews = async () => {
            setIsLoadingNews(true);
            const result = await newsService.getAllNews(1, 4);
            if (result.success) {
                const formattedNews = result.data.map((n, index) => ({
                    id: n._id,
                    title: n.title,
                    desc: n.desc,
                    image: getImageUrl(n.image),
                    slug: n.slug,
                    featured: index === 0
                }));
                setNews(formattedNews);
            }
            setIsLoadingNews(false);
        };

        fetchProducts();
        fetchNews();
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % 3);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + 3) % 3);
    };

    // Product carousel functions
    const nextProduct = () => {
        setCurrentProductIndex((prev) => (prev + 1) % products.length);
    };

    const prevProduct = () => {
        setCurrentProductIndex((prev) => (prev - 1 + products.length) % products.length);
    };

    // Get visible products (4 at a time, wrap around)
    const getVisibleProducts = () => {
        const visibleProducts = [];
        for (let i = 0; i < 4; i++) {
            const index = (currentProductIndex + i) % products.length;
            visibleProducts.push(products[index]);
        }
        return visibleProducts;
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        console.log('Contact:', contactEmail);
        setContactEmail('');
    };

    // Star rating component
    const StarRating = ({ rating = 5 }) => (
        <p className="vote">
            {[...Array(rating)].map((_, i) => (
                <span key={i}>
                    <Star size={14} fill="#bd945f" color="#bd945f" />
                </span>
            ))}
        </p>
    );

    return (
        <div className="wrap">
            {/* BANNER */}
            <section className="banner">
                <div className="relative overflow-hidden">
                    <div className="carousel-inner">
                        {[0, 1, 2].map((index) => (
                            <div
                                key={index}
                                className={`carousel-item ${currentSlide === index ? 'active block' : 'hidden'}`}
                            >
                                <img src={bannerImg} className="block w-full" alt="Banner" />
                                <div className="content-box-banner">
                                    <h2 className="text-uppercase header-banner">
                                        THẾ GIỚI NỘI THẤT SỐ 1 VIỆT NAM <br />
                                        <span>Nestora</span>
                                    </h2>
                                    <div className="sapo-banner">
                                        <p>
                                            Sứ mệnh của chúng tôi là kết hợp hài hòa giữa ý tưởng và mong muốn của khách hàng,
                                            đem lại những phút giây thư giãn tuyệt vời bên gia đình và những người thân yêu.
                                        </p>
                                    </div>
                                    <Link to="/contact" className="text-uppercase btn-banner">
                                        Liên hệ ngay
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CATEGORIES & HOT PRODUCTS */}
            <div className="content-wrap container mx-auto px-4">
                {/* Categories */}
                <section className="categories">
                    {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                            <div key={category.id} className="category-item">
                                <Link to={`/products?category=${category.id}`}>
                                    <div className="category-icon">
                                        <IconComponent size={48} strokeWidth={1.5} />
                                    </div>
                                    <p>{category.name}</p>
                                </Link>
                            </div>
                        );
                    })}
                </section>

                {/* Hot Products */}
                <section className="hot-product-wrap">
                    <h2 className="header-prd">Sản phẩm nổi bật</h2>

                    {isLoadingProducts ? (
                        <div className="text-center py-10">
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : products.length > 0 ? (
                        <div className="relative">
                            {/* Prev Button */}
                            <button
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                                onClick={prevProduct}
                            >
                                <ChevronLeft size={24} className="text-gray-600" />
                            </button>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {getVisibleProducts().map((product) => (
                                    <div key={product.id} className="product">
                                        <div className="img">
                                            <img src={product.image} alt={product.name} className="w-full" />
                                        </div>
                                        <div className="info">
                                            <p className="name">
                                                <Link to={`/products/${product.id}`}>{product.name}</Link>
                                            </p>
                                            <StarRating rating={5} />
                                            <p className="desc">{product.desc}</p>
                                            <p className="price">
                                                <span>{product.price}</span> VNĐ
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-md p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                                onClick={nextProduct}
                            >
                                <ChevronRight size={24} className="text-gray-600" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p>Không có sản phẩm nào.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* ABOUT US */}
            <section className="about-us" style={{ backgroundImage: `url(${tintuc0Img})` }}>
                <div className="container mx-auto px-4 relative z-10">
                    <h2 className="header-abt">Về chúng tôi</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="img h-full">
                            <img
                                src={tintuc0Img}
                                alt="NỘI THẤT NESTORA UY TÍN SONG HÀNH CHẤT LƯỢNG"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="content h-full">
                            <h3>NỘI THẤT NESTORA UY TÍN SONG HÀNH CHẤT LƯỢNG</h3>
                            <div>
                                <p>
                                    Nội thất Nestora chúng tôi tự hào là đứa con tinh thần ra đời sau hơn 30 năm
                                    hoạt động trong lĩnh vực kinh doanh đồ gỗ nội thất với thương hiệu ĐỒ GỖ NESTORA nổi tiếng.
                                </p>
                                <p>
                                    Tài nguyên của chúng tôi là đội ngũ kiến trúc sư tốt nghiệp ĐH Kiến Trúc Hà Nội
                                    với nhiều năm kinh nghiệm, luôn tràn đầy nhiệt huyết và sức sáng tạo của tuổi trẻ.
                                    Thế mạnh của chúng tôi là sở hữu xưởng nội thất hơn 10.000m2 tại Hà Nội sản xuất
                                    đa dạng các sản phẩm với giá cả luôn cạnh tranh.
                                </p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <img alt="giới thiệu" src={"public/images/AnhCat/tintuc-2.png"} className="w-1/4" />
                                <img alt="giới thiệu" src={"public/images/AnhCat/tintuc-2.png"} className="w-1/4" />
                                <img alt="giới thiệu" src={"public/images/AnhCat/tintuc-3.png"} className="w-1/4" />
                                <img alt="giới thiệu" src={"public/images/AnhCat/tintuc-6.png"} className="w-1/4" />
                            </div>
                        </div>
                    </div>

                    <br /><br />
                    <h2 className="header-abt">Tại sao nên chọn Nestora?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reasons.map((reason) => (
                            <div key={reason.id} className="reason-index-item flex">
                                <div className="img">
                                    <img src={reason.icon} alt={reason.title} />
                                </div>
                                <div className="content">
                                    <h3 className="title">{reason.title}</h3>
                                    <p className="desc">{reason.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SUGGESTED PRODUCTS */}
            <section className="suggested-products">
                <div className="container mx-auto px-4">
                    <h2 className="header-prd">Sản phẩm gợi ý dành cho bạn</h2>
                    <p className="text-center text-gray-600 mb-8">Những sản phẩm được chọn lọc phù hợp với phong cách của bạn</p>

                    {isLoadingProducts ? (
                        <div className="text-center py-10">
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : products.length >= 4 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {products.slice(4, 8).map((product) => (
                                    <div key={`suggested-${product.id}`} className="product suggested-item">
                                        <div className="img">
                                            <img src={product.image} alt={product.name} className="w-full" />
                                            <div className="overlay">
                                                <Link to={`/products/${product.id}`} className="view-btn">
                                                    Xem chi tiết
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="info">
                                            <p className="name">
                                                <Link to={`/products/${product.id}`}>{product.name}</Link>
                                            </p>
                                            <StarRating rating={5} />
                                            <p className="desc">{product.desc}</p>
                                            <p className="price">
                                                <span>{product.price}</span> VNĐ
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-8">
                                <Link to="/products" className="btn-view-all">
                                    Xem tất cả sản phẩm <ArrowRight size={16} className="inline ml-1" />
                                </Link>
                            </div>
                        </>
                    ) : null}
                </div>
            </section>

            {/* NEWS */}
            <section className="news">
                <div className="container mx-auto px-4">
                    <h2 className="header-news">Tin tức</h2>

                    {isLoadingNews ? (
                        <div className="text-center py-10">
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : news.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Featured News */}
                            <div className="lg:col-span-7">
                                {news.filter(n => n.featured).map((item) => (
                                    <div key={item.id} className="box">
                                        <div className="img">
                                            <img src={item.image} alt={item.title} className="w-full" />
                                        </div>
                                        <div className="news-content">
                                            <p className="title">
                                                <Link to={`/news/${item.slug}`}>{item.title}</Link>
                                            </p>
                                            <div className="desc">
                                                <p>{item.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* News List */}
                            <div className="lg:col-span-5">
                                <ul>
                                    {news.filter(n => !n.featured).map((item) => (
                                        <li key={item.id} className="flex mb-4">
                                            <div className="img">
                                                <img src={item.image} alt={item.title} />
                                            </div>
                                            <div className="content">
                                                <p className="title">
                                                    <Link to={`/news/${item.slug}`}>{item.title}</Link>
                                                </p>
                                                <div className="desc sub-news-content">{item.desc}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div>
                                    <Link to="/news" className="see-more">
                                        Xem thêm <ArrowRight size={16} className="inline ml-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p>Không có tin tức nào.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* PARTNER */}
            <section className="partner">
                <div className="container mx-auto px-4">
                    <h2 className="header-ptn">Đối tác</h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                        {partners.map((partner) => (
                            <div key={partner.id} className="ptn-item">
                                <div className="img">
                                    <img src={partner.image} alt={partner.name} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT */}
            <section className="contact contact-index" style={{ backgroundImage: `url(${lienheBgImg})` }}>
                <span>
                    <img src={gheImg} alt="Trải nghiệm cùng Nestora" />
                </span>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="title">
                                Trải nghiệm dịch vụ <br />
                                <strong>cùng Nestora ngay</strong>
                            </h2>
                        </div>
                        <div>
                            <p className="mb-1 text-white">Thông tin liên hệ</p>
                            <form onSubmit={handleContactSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Email/Số điện thoại"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                />
                                <button type="submit" className="savePhone">
                                    Gửi
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
