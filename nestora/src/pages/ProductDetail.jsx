import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, ChevronRight, Check, ArrowLeft, Upload, X, Loader } from 'lucide-react';
import productService from '../services/productService';
import * as cartService from '../services/cartService';
import reviewService from '../services/reviewService';
import uploadService from '../services/uploadService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';
import { getImageUrl } from '../lib/utils';

// Image paths từ public folder
const bannerSanPhamImg = '/images/AnhCat/banner-san-pham.png';

const StarRating = ({ rating = 5, size = 16 }) => (
    <div className="star-rating">
        {[...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={size}
                fill={i < rating ? "#bd945f" : "transparent"}
                color="#bd945f"
            />
        ))}
    </div>
);

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { refreshCart } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [selectedImage, setSelectedImage] = useState(0);
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [togglingFavorite, setTogglingFavorite] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', images: [] });
    const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewStatus, setReviewStatus] = useState({ hasPurchased: false, hasReviewed: false, myReview: null });

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            const result = await productService.getProductById(id);
            if (result.success) {
                const p = result.data;
                // Xử lý ảnh - ưu tiên images array, fallback sang image
                const rawImages = p.images && p.images.length > 0 ? p.images : [p.image];
                const processedImages = rawImages.map(img => getImageUrl(img));

                setProduct({
                    id: p._id,
                    name: p.name,
                    desc: p.desc || p.description,
                    price: p.price,
                    priceDisplay: p.price.toLocaleString('vi-VN'),
                    images: processedImages,
                    category: p.category,
                    sku: p.sku,
                    material: p.material,
                    dimensions: p.dimensions,
                    color: p.color,
                    warranty: p.warranty,
                    stock: p.stock,
                    description: p.description,
                    reviews: p.reviews || []
                });

                const relatedResult = await productService.getProductsByCategory(p.category);
                if (relatedResult.success) {
                    setRelatedProducts(
                        relatedResult.data
                            .filter(rp => rp._id !== p._id)
                            .slice(0, 4)
                            .map(rp => ({
                                id: rp._id,
                                name: rp.name,
                                price: rp.price,
                                priceDisplay: rp.price.toLocaleString('vi-VN'),
                                image: getImageUrl(rp.images && rp.images[0] ? rp.images[0] : rp.image)
                            }))
                    );
                }
            }
            setIsLoading(false);
        };
        fetchProduct();
    }, [id]);

    // Check favorite status
    useEffect(() => {
        if (isAuthenticated && product) {
            userService.getPreferences().then(result => {
                if (result.success && result.data?.favoriteDishes) {
                    setIsFavorite(
                        result.data.favoriteDishes.some(d => d._id === product.id)
                    );
                }
            });
        }
    }, [isAuthenticated, product]);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            if (!id) return;
            setIsLoadingReviews(true);
            const result = await reviewService.getProductReviews(id);
            if (result.success) {
                setReviews(result.reviews || []);
            }
            setIsLoadingReviews(false);
        };
        fetchReviews();
    }, [id]);

    // Fetch review status (purchase + existing review) when authenticated
    useEffect(() => {
        if (!isAuthenticated || !id) return;
        reviewService.getReviewStatus(id).then(result => {
            if (result.success) {
                setReviewStatus(result.data);
            }
        });
    }, [isAuthenticated, id]);

    // Handle review image selection
    const handleReviewImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validation = uploadService.validateMultipleImages(files);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }

        const previews = await Promise.all(
            files.map(file => uploadService.createImagePreview(file))
        );
        const filteredPreviews = previews.filter(p => p !== null);
        setReviewImagePreviews(prev => [...prev, ...filteredPreviews]);
        setReviewForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const removeReviewImage = (index) => {
        setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
        setReviewForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Submit review
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để đánh giá');
            navigate('/login');
            return;
        }

        if (!reviewForm.comment.trim()) {
            toast.error('Vui lòng nhập nhận xét');
            return;
        }

        setIsSubmittingReview(true);
        try {
            let imageUrls = [];
            if (reviewForm.images.length > 0) {
                const uploadResult = await uploadService.uploadMultiple(reviewForm.images, 'reviews');
                if (uploadResult.success) {
                    imageUrls = uploadResult.data.map(img => img.url);
                }
            }

            const result = await reviewService.addReview(id, {
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                images: imageUrls
            });

            if (result.success) {
                toast.success(result.message || 'Đánh giá thành công');
                setReviewForm({ rating: 5, comment: '', images: [] });
                setReviewImagePreviews([]);
                // Refresh reviews and status
                const [reviewsResult, statusResult] = await Promise.all([
                    reviewService.getProductReviews(id),
                    reviewService.getReviewStatus(id)
                ]);
                if (reviewsResult.success) setReviews(reviewsResult.reviews || []);
                if (statusResult.success) setReviewStatus(statusResult.data);
                // Switch to reviews tab to show new review
                setActiveTab('reviews');
            } else {
                toast.error(result.message || 'Không thể gửi đánh giá');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gửi đánh giá');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (isLoading) {
        return (
            <div className="product-detail-page">
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>Đang tải thông tin sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="not-found-page">
                <div className="container mx-auto px-4 text-center py-20">
                    <h1>Sản phẩm không tồn tại</h1>
                    <p>Xin lỗi, sản phẩm bạn tìm kiếm không tồn tại.</p>
                    <Link to="/products" className="btn-back">Quay lại danh sách</Link>
                </div>
            </div>
        );
    }

    const handleQuantityChange = (action) => {
        if (action === 'increase' && quantity < product.stock) {
            setQuantity(quantity + 1);
        } else if (action === 'decrease' && quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
            navigate('/login');
            return;
        }

        if (!product?.id) {
            toast.error('Không tìm thấy sản phẩm');
            return;
        }

        setIsAddingToCart(true);
        const result = await cartService.addToCart(product.id, quantity);

        if (result.success) {
            toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
            setQuantity(1); // Reset quantity
            refreshCart(); // Update cart count in header
        } else {
            toast.error(result.message);
        }
        setIsAddingToCart(false);
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thêm vào yêu thích');
            navigate('/login');
            return;
        }
        setTogglingFavorite(true);
        if (isFavorite) {
            const result = await userService.removeFavoriteDish(product.id);
            if (result.success) {
                setIsFavorite(false);
                toast.success('Đã xóa khỏi danh sách yêu thích');
            } else {
                toast.error(result.message);
            }
        } else {
            const result = await userService.addFavoriteDish(product.id);
            if (result.success) {
                setIsFavorite(true);
                toast.success('Đã thêm vào danh sách yêu thích');
            } else {
                toast.error(result.message);
            }
        }
        setTogglingFavorite(false);
    };

    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % product.images.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    };

    return (
        <div className="product-detail-page">
            {/* Banner */}
            <section className="page-banner">
                <img src={bannerSanPhamImg} alt="Chi tiết sản phẩm" className="banner-image" />
            </section>

            {/* Back Button */}
            <div className="back-nav container mx-auto px-4">
                <button onClick={() => navigate(-1)} className="btn-go-back">
                    <ArrowLeft size={18} />
                    Quay lại
                </button>
            </div>

            {/* Product Detail */}
            <section className="product-detail-content">
                <div className="container mx-auto px-4">
                    <div className="product-detail-grid">
                        {/* Product Images */}
                        <div className="product-images">
                            <div className="main-image">
                                <img src={product.images[selectedImage]} alt={product.name} />
                                {product.images.length > 1 && (
                                    <>
                                        <button className="img-nav prev" onClick={prevImage}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button className="img-nav next" onClick={nextImage}>
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </div>
                            {product.images.length > 1 && (
                                <div className="thumbnail-list">
                                    {product.images.map((img, index) => (
                                        <button
                                            key={index}
                                            className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <img src={img} alt={`${product.name} ${index + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="product-info-detail">
                            <span className="product-category-tag">{product.category}</span>
                            <h1 className="product-title">{product.name}</h1>

                            <div className="product-meta">
                                <StarRating rating={5} size={18} />
                                <span className="reviews">({product.reviews.length} đánh giá)</span>
                                <span className="sku">SKU: {product.sku}</span>
                            </div>

                            <div className="product-price-detail">
                                <span className="current-price">{product.priceDisplay} VNĐ</span>
                            </div>

                            <p className="product-short-desc">{product.desc}</p>

                            <div className="product-specs">
                                <div className="spec-item">
                                    <span className="spec-label">Chất liệu:</span>
                                    <span className="spec-value">{product.material}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Kích thước:</span>
                                    <span className="spec-value">{product.dimensions}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Màu sắc:</span>
                                    <span className="spec-value">{product.color}</span>
                                </div>
                                <div className="spec-item">
                                    <span className="spec-label">Bảo hành:</span>
                                    <span className="spec-value">{product.warranty}</span>
                                </div>
                            </div>


                            <div className="product-actions">
                                <div className="quantity-selector">
                                    <button onClick={() => handleQuantityChange('decrease')}>
                                        <Minus size={18} />
                                    </button>
                                    <input type="text" value={quantity} readOnly />
                                    <button onClick={() => handleQuantityChange('increase')}>
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <button
                                    className="btn-add-cart"
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart || isLoading}
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                            <span>Đang thêm...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart size={20} />
                                            <span>Thêm vào giỏ</span>
                                        </>
                                    )}
                                </button>
                                <button className="btn-wishlist"
                                    onClick={handleToggleFavorite}
                                    disabled={togglingFavorite}
                                    title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                >
                                    <Heart size={20} fill={isFavorite ? '#bd945f' : 'transparent'} color="#bd945f" />
                                </button>
                                <button className="btn-share">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product Tabs */}
                    <div className="product-tabs">
                        <div className="tabs-header">
                            <button
                                className={activeTab === 'description' ? 'active' : ''}
                                onClick={() => setActiveTab('description')}
                            >
                                Mô tả sản phẩm
                            </button>
                            <button
                                className={activeTab === 'reviews' ? 'active' : ''}
                                onClick={() => setActiveTab('reviews')}
                            >
                                Đánh giá ({reviews.length})
                            </button>
                        </div>
                        <div className="tabs-content">
                            {activeTab === 'description' && (
                                <div className="tab-pane editor-content" dangerouslySetInnerHTML={{ __html: product.description }} />
                            )}
                            {activeTab === 'reviews' && (
                                <div className="tab-pane">
                                    {/* Review Form / Status Banner */}
                                    {!isAuthenticated ? (
                                        <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f8f4ef', border: '1px solid #e8d5b7', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: 0, color: '#7a5c3a' }}>
                                                <Link to="/login" style={{ color: '#bd945f', fontWeight: 600 }}>Đăng nhập</Link> để đánh giá sản phẩm
                                            </p>
                                        </div>
                                    ) : reviewStatus.hasReviewed ? (
                                        <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <Check size={18} color="#16a34a" />
                                                <strong style={{ color: '#16a34a' }}>Bạn đã đánh giá sản phẩm này</strong>
                                            </div>
                                            {reviewStatus.myReview && (
                                                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #bbf7d0' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                        <StarRating rating={reviewStatus.myReview.rating} size={14} />
                                                        <span style={{ fontSize: '13px', color: '#555' }}>{new Date(reviewStatus.myReview.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#444' }}>{reviewStatus.myReview.comment}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : !reviewStatus.hasPurchased ? (
                                        <div style={{ marginBottom: '2rem', padding: '1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', textAlign: 'center' }}>
                                            <p style={{ margin: 0, color: '#92400e' }}>Bạn cần <strong>mua và hoàn thành đơn hàng</strong> sản phẩm này để có thể đánh giá</p>
                                        </div>
                                    ) : (
                                        <div className="review-form" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fafafa' }}>
                                            <h4 style={{ marginBottom: '0.75rem', fontSize: '16px' }}>Viết đánh giá của bạn</h4>
                                            <form onSubmit={handleSubmitReview}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', marginBottom: '0.75rem', alignItems: 'start' }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', fontWeight: '500' }}>
                                                            Đánh giá: {reviewForm.rating} sao
                                                        </label>
                                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <button
                                                                    key={star}
                                                                    type="button"
                                                                    onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                                                >
                                                                    <Star
                                                                        size={20}
                                                                        fill={star <= reviewForm.rating ? "#bd945f" : "transparent"}
                                                                        color="#bd945f"
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', fontWeight: '500' }}>
                                                            Nhận xét <span style={{ color: 'red' }}>*</span>
                                                        </label>
                                                        <textarea
                                                            value={reviewForm.comment}
                                                            onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                                                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                                                            rows={3}
                                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', resize: 'vertical' }}
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '0.75rem' }}>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', fontWeight: '500' }}>
                                                        Hình ảnh (Tùy chọn)
                                                    </label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {reviewImagePreviews.map((previewData, index) => (
                                                            <div key={index} style={{ position: 'relative', width: '70px', height: '70px' }}>
                                                                <img src={previewData.preview} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeReviewImage(index)}
                                                                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {reviewImagePreviews.length < 10 && (
                                                            <label style={{ width: '70px', height: '70px', border: '2px dashed #ddd', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff' }}>
                                                                <Upload size={20} color="#888" />
                                                                <span style={{ fontSize: '10px', color: '#888', marginTop: '0.25rem' }}>Thêm</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                                    multiple
                                                                    onChange={handleReviewImageSelect}
                                                                    style={{ display: 'none' }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '11px', color: '#888', marginTop: '0.25rem', marginBottom: 0 }}>
                                                        Tối đa 10 ảnh, mỗi ảnh &lt; 5MB
                                                    </p>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmittingReview}
                                                    style={{ padding: '0.5rem 1.5rem', background: '#bd945f', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmittingReview ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    {isSubmittingReview && <Loader size={16} className="animate-spin" />}
                                                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Reviews List */}
                                    <div className="reviews-list">
                                        <h4 style={{ marginBottom: '1.5rem', fontSize: '18px', fontWeight: '600' }}>
                                            Đánh giá từ khách hàng ({reviews.length})
                                        </h4>
                                        {isLoadingReviews ? (
                                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                                <Loader size={32} className="animate-spin" style={{ margin: '0 auto', color: '#bd945f' }} />
                                            </div>
                                        ) : reviews.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                                                Chưa có đánh giá nào. {isAuthenticated ? 'Hãy là người đầu tiên đánh giá sản phẩm này!' : 'Đăng nhập để đánh giá sản phẩm.'}
                                            </p>
                                        ) : (
                                            reviews.map((review) => (
                                                <div key={review._id} className="review-item" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #f0f0f0', borderRadius: '8px' }}>
                                                    <div className="review-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                                        <strong>{review.userId?.name || 'Người dùng'}</strong>
                                                        <StarRating rating={review.rating} size={14} />
                                                        <span className="review-date" style={{ color: '#888', fontSize: '13px' }}>
                                                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <p style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}>{review.comment}</p>
                                                    {review.images && review.images.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                                            {review.images.map((img, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={getImageUrl(img)}
                                                                    alt={`Review ${idx + 1}`}
                                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer' }}
                                                                    onClick={() => window.open(getImageUrl(img), '_blank')}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div className="related-products">
                            <h2>Sản phẩm liên quan</h2>
                            <div className="related-grid">
                                {relatedProducts.map((item) => (
                                    <div key={item.id} className="product-card">
                                        <div className="product-image">
                                            <img src={item.image} alt={item.name} />
                                            <div className="product-overlay">
                                                <Link to={`/products/${item.id}`} className="btn-view">
                                                    Xem chi tiết
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="product-info">
                                            <h3 className="product-name">
                                                <Link to={`/products/${item.id}`}>{item.name}</Link>
                                            </h3>
                                            <StarRating rating={5} size={14} />
                                            <p className="product-price">
                                                <span>{item.priceDisplay}</span> VNĐ
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ProductDetailPage;
