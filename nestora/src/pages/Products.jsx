import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Search, Grid, List, Filter, X, Heart } from 'lucide-react';
import productService, { CATEGORIES } from '../services/productService';
import userService from '../services/userService';
import { getImageUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { htmlToPlainText } from '../utils/text';
import { toast } from 'sonner';

// Image paths từ public folder
const bannerSanPhamImg = '/images/AnhCat/banner-san-pham.png';
const phongKhachImg = '/images/AnhCat/phong-khach.png';
const phongNguImg = '/images/AnhCat/phong-ngu.png';
const phongBepImg = '/images/AnhCat/phong-bep.png';
const phongTamImg = '/images/AnhCat/phong-tam.png';
const treEmImg = '/images/AnhCat/tre-em.png';
const vanPhongImg = '/images/AnhCat/van-phong.png';
const cauThangImg = '/images/AnhCat/cau-thang.png';
const denTrangTriImg = '/images/AnhCat/den-trang-tri.png';
const sp1Img = '/images/AnhCat/sp-1.png';
const sp2Img = '/images/AnhCat/sp-2.png';
const sp3Img = '/images/AnhCat/sp-3.png';
const sp4Img = '/images/AnhCat/sp-4.png';
const giuongNguImg = '/images/AnhCat/giuong-ngu.png';
const tuQuanAoImg = '/images/AnhCat/tu-quan-ao.png';
const keDauGiuongImg = '/images/AnhCat/ke-dau-giuong.png';
const banUongNuocImg = '/images/AnhCat/phong-khach-ban-uong-nuoc.png';
const gheImg = '/images/AnhCat/ghe.png';

// Categories data
const categories = [
    { id: 0, name: 'Tất cả', slug: 'all', image: null },
    { id: 1, name: 'Phòng khách', slug: 'phong-khach', image: phongKhachImg },
    { id: 2, name: 'Phòng ngủ', slug: 'phong-ngu', image: phongNguImg },
    { id: 3, name: 'Phòng bếp', slug: 'phong-bep', image: phongBepImg },
    { id: 4, name: 'Phòng tắm', slug: 'phong-tam', image: phongTamImg },
    { id: 5, name: 'Trẻ em', slug: 'tre-em', image: treEmImg },
    { id: 6, name: 'Văn phòng', slug: 'van-phong', image: vanPhongImg },
    { id: 7, name: 'Cầu thang', slug: 'cau-thang', image: cauThangImg },
    { id: 8, name: 'Đèn trang trí', slug: 'den-trang-tri', image: denTrangTriImg },
];

// Sort options
const sortOptions = [
    { value: 'default', label: 'Mặc định' },
    { value: 'price-asc', label: 'Giá: Thấp đến cao' },
    { value: 'price-desc', label: 'Giá: Cao đến thấp' },
    { value: 'name-asc', label: 'Tên: A-Z' },
    { value: 'name-desc', label: 'Tên: Z-A' },
];

// Star Rating Component
const StarRating = ({ rating = 5 }) => (
    <div className="product-rating">
        {[...Array(rating)].map((_, i) => (
            <Star key={i} size={14} fill="#bd945f" color="#bd945f" />
        ))}
    </div>
);

const ProductsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(
        parseInt(searchParams.get('category')) || 0
    );
    const [sortBy, setSortBy] = useState('default');
    const [viewMode, setViewMode] = useState('grid');
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [togglingFavorite, setTogglingFavorite] = useState(null);
    const [buyingNowId, setBuyingNowId] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            const result = await productService.getAllProducts();
            if (result.success) {
                const formattedProducts = result.data.map(p => ({
                    id: p._id,
                    name: p.name,
                    desc: htmlToPlainText(p.desc || p.description),
                    price: p.price,
                    priceDisplay: p.price.toLocaleString('vi-VN'),
                    image: getImageUrl(p.images && p.images[0] ? p.images[0] : p.image),
                    categoryId: getCategoryIdBySlug(p.category),
                    categorySlug: p.category,
                    stock: p.stock
                }));
                setProducts(formattedProducts);
            }
            setIsLoading(false);
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (user) {
            userService.getPreferences().then(result => {
                if (result.success && result.data?.favoriteDishes) {
                    setFavoriteIds(new Set(result.data.favoriteDishes.map(d => d._id)));
                }
            });
        }
    }, [user]);

    const getCategoryIdBySlug = (slug) => {
        const category = categories.find(c => c.slug === slug);
        return category ? category.id : 0;
    };

    const handleToggleFavorite = async (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated()) {
            toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
            navigate('/login');
            return;
        }
        setTogglingFavorite(productId);
        const isFav = favoriteIds.has(productId);
        if (isFav) {
            const result = await userService.removeFavoriteDish(productId);
            if (result.success) {
                setFavoriteIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
                toast.success('Đã xóa khỏi danh sách yêu thích');
            } else {
                toast.error(result.message);
            }
        } else {
            const result = await userService.addFavoriteDish(productId);
            if (result.success) {
                setFavoriteIds(prev => new Set([...prev, productId]));
                toast.success('Đã thêm vào danh sách yêu thích');
            } else {
                toast.error(result.message);
            }
        }
        setTogglingFavorite(null);
    };

    const handleBuyNow = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated()) {
            toast.error('Vui lòng đăng nhập để mua ngay');
            navigate('/login');
            return;
        }

        if (!product?.id) {
            toast.error('Không tìm thấy sản phẩm');
            return;
        }

        if (Number(product.stock) <= 0) {
            toast.error('Sản phẩm hiện đã hết hàng');
            return;
        }

        setBuyingNowId(product.id);

        navigate('/checkout', {
            state: {
                buyNowItem: {
                    productId: product.id,
                    name: product.name,
                    image: product.image,
                    price: product.price,
                    quantity: 1,
                    subtotal: product.price,
                    stock: product.stock
                }
            }
        });

        setBuyingNowId(null);
    };

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (selectedCategory !== 0) {
            result = result.filter(product => product.categoryId === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(product =>
                product.name.toLowerCase().includes(query) ||
                product.desc.toLowerCase().includes(query)
            );
        }

        // Filter by price range
        if (priceRange.min) {
            result = result.filter(product => product.price >= parseInt(priceRange.min));
        }
        if (priceRange.max) {
            result = result.filter(product => product.price <= parseInt(priceRange.max));
        }

        // Sort products
        switch (sortBy) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
                break;
            case 'name-desc':
                result.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
                break;
            default:
                break;
        }

        return result;
    }, [products, selectedCategory, searchQuery, sortBy, priceRange]);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        if (categoryId === 0) {
            searchParams.delete('category');
        } else {
            searchParams.set('category', categoryId.toString());
        }
        setSearchParams(searchParams);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory(0);
        setSortBy('default');
        setPriceRange({ min: '', max: '' });
        setSearchParams({});
    };

    const hasActiveFilters = selectedCategory !== 0 || searchQuery || priceRange.min || priceRange.max;

    if (isLoading) {
        return (
            <div className="products-page">
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>Đang tải sản phẩm...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="products-page">
            <section className="page-banner">
                <img src={bannerSanPhamImg} alt="Sản phẩm" className="banner-image" />
            </section>

            <div className="products-content container mx-auto px-4">
                <div className="products-layout">
                    {/* Sidebar Filters */}
                    <aside className={`products-sidebar ${showMobileFilter ? 'active' : ''}`}>
                        <div className="sidebar-header">
                            <h3>
                                <Filter size={18} />
                                Bộ lọc
                            </h3>
                            <button
                                className="sidebar-close"
                                onClick={() => setShowMobileFilter(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="filter-section">
                            <h4>Tìm kiếm</h4>
                            <form onSubmit={handleSearchSubmit} className="search-form">
                                <input
                                    type="text"
                                    placeholder="Tìm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit">
                                    <Search size={18} />
                                </button>
                            </form>
                        </div>

                        {/* Categories */}
                        <div className="filter-section">
                            <h4>Danh mục</h4>
                            <ul className="category-list">
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <button
                                            className={selectedCategory === category.id ? 'active' : ''}
                                            onClick={() => handleCategoryChange(category.id)}
                                        >
                                            {category.name}
                                            <span className="count">
                                                ({category.id === 0
                                                    ? products.length
                                                    : products.filter(p => p.categoryId === category.id).length
                                                })
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Price Range */}
                        <div className="filter-section">
                            <h4>Khoảng giá</h4>
                            <div className="price-inputs">
                                <input
                                    type="number"
                                    placeholder="Từ"
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Đến"
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button className="btn-clear-filters" onClick={clearFilters}>
                                <X size={16} />
                                Xóa bộ lọc
                            </button>
                        )}
                    </aside>

                    {/* Products Grid */}
                    <main className="products-main">
                        {/* Toolbar */}
                        <div className="products-toolbar">
                            <div className="toolbar-left">
                                <button
                                    className="btn-filter-mobile"
                                    onClick={() => setShowMobileFilter(true)}
                                >
                                    <Filter size={18} />
                                    Bộ lọc
                                </button>
                                <span className="results-count">
                                    Hiển thị {filteredProducts.length} sản phẩm
                                </span>
                            </div>
                            <div className="toolbar-right">
                                <div className="sort-select">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        {sortOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="view-toggle">
                                    <button
                                        className={viewMode === 'grid' ? 'active' : ''}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button
                                        className={viewMode === 'list' ? 'active' : ''}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Tags */}
                        {hasActiveFilters && (
                            <div className="active-filters">
                                {selectedCategory !== 0 && (
                                    <span className="filter-tag">
                                        {categories.find(c => c.id === selectedCategory)?.name}
                                        <button onClick={() => handleCategoryChange(0)}>
                                            <X size={14} />
                                        </button>
                                    </span>
                                )}
                                {searchQuery && (
                                    <span className="filter-tag">
                                        "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')}>
                                            <X size={14} />
                                        </button>
                                    </span>
                                )}
                                {(priceRange.min || priceRange.max) && (
                                    <span className="filter-tag">
                                        {priceRange.min || '0'} - {priceRange.max || '∞'} VNĐ
                                        <button onClick={() => setPriceRange({ min: '', max: '' })}>
                                            <X size={14} />
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Products Grid/List */}
                        {filteredProducts.length > 0 ? (
                            <div className={`products-grid ${viewMode}`}>
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="product-card">
                                        <div className="product-image">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                loading="lazy"
                                                decoding="async"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    const fallback = '/images/AnhCat/sp-1.png';
                                                    if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                                                }}
                                            />
                                            <div className="product-overlay">
                                                <Link to={`/products/${product.id}`} className="btn-view">
                                                    Xem chi tiết
                                                </Link>
                                            </div>
                                            <button
                                                className="btn-wishlist"
                                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}
                                                onClick={(e) => handleToggleFavorite(e, product.id)}
                                                disabled={togglingFavorite === product.id}
                                                title={favoriteIds.has(product.id) ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                            >
                                                <Heart size={16} fill={favoriteIds.has(product.id) ? '#bd945f' : 'transparent'} color="#bd945f" />
                                            </button>
                                        </div>
                                        <div className="product-info">
                                            <span className="product-category">
                                                {categories.find(c => c.id === product.categoryId)?.name}
                                            </span>
                                            <h3 className="product-name">
                                                <Link to={`/products/${product.id}`}>{product.name}</Link>
                                            </h3>
                                            <StarRating rating={5} />
                                            <p className="product-desc">{product.desc}</p>
                                            <p className="product-price">
                                                <span>{product.priceDisplay}</span> VNĐ
                                            </p>
                                            <div className="product-card-actions-customer">
                                                <Link to={`/products/${product.id}`} className="btn-detail-inline">
                                                    Xem chi tiết
                                                </Link>
                                                <button
                                                    className="btn-buy-now"
                                                    onClick={(e) => handleBuyNow(e, product)}
                                                    disabled={buyingNowId === product.id || Number(product.stock) <= 0}
                                                >
                                                    {buyingNowId === product.id ? 'Đang xử lý...' : Number(product.stock) <= 0 ? 'Hết hàng' : 'Mua ngay'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-products">
                                <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                                <button onClick={clearFilters}>Xóa bộ lọc</button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            <div
                className={`filter-overlay ${showMobileFilter ? 'active' : ''}`}
                onClick={() => setShowMobileFilter(false)}
            ></div>
        </div>
    );
};

export default ProductsPage;
