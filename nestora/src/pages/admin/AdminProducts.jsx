import { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
    Package,
    Grid,
    List,
    Upload,
    Loader
} from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import productService, { CATEGORIES, CATEGORY_LIST } from '../../services/productService';
import uploadService from '../../services/uploadService';
import { getImageUrl } from '../../lib/utils';
import { toast } from 'sonner';

// Product Form Modal
const ProductFormModal = ({ isOpen, onClose, product, onSave }) => {
    const editorRef = useRef(null);
    const defaultFormData = {
        name: '',
        category: '',
        price: '',
        stock: '',
        desc: '',
        description: '',
        images: [],
        thumbnail: '',
        sku: '',
        material: '',
        dimensions: '',
        color: '',
        warranty: ''
    };
    const [formData, setFormData] = useState(product || {
        name: '',
        category: '',
        price: '',
        stock: '',
        desc: '',
        description: '',
        images: [],
        thumbnail: '',
        sku: '',
        material: '',
        dimensions: '',
        color: '',
        warranty: ''
    });
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (product) {
            setFormData(product);
            // Set existing images as previews
            if (product.images && product.images.length > 0) {
                setImagePreviews(product.images.map((url, index) => ({
                    preview: getImageUrl(url),
                    url: url,
                    uploaded: true,
                    id: index
                })));
            } else {
                setImagePreviews([]);
            }
        } else if (isOpen) {
            // Reset form when opening modal for creating a new product
            setFormData(defaultFormData);
            setImagePreviews([]);
        }
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleImageSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validate files
        const validation = uploadService.validateMultipleImages(files);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }

        // Create previews
        const previews = await Promise.all(
            files.map(async (file) => {
                const preview = await uploadService.createImagePreview(file);
                return preview ? { ...preview, uploaded: false, id: `${file.name}-${file.size}-${Date.now()}` } : null;
            })
        );

        const validPreviews = previews.filter(Boolean);
        if (validPreviews.length === 0) {
            toast.error('Không thể đọc ảnh đã chọn');
            e.target.value = '';
            return;
        }

        setImagePreviews(prev => [...prev, ...validPreviews].slice(0, 10));
        e.target.value = '';
    };

    const handleRemoveImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async () => {
        const filesToUpload = imagePreviews.filter(img => !img.uploaded && img.file);

        if (filesToUpload.length === 0) {
            const existingOnly = imagePreviews
                .filter(img => img.uploaded)
                .map(img => img.url)
                .filter((url) => typeof url === 'string' && url.trim().length > 0);
            return existingOnly;
        }

        setIsUploading(true);
        const uploadedUrls = [];

        // Upload single or multiple
        if (filesToUpload.length === 1) {
            const result = await uploadService.uploadSingle(filesToUpload[0].file, 'products');
            if (result.success) {
                uploadedUrls.push(result.data.url);
            } else {
                toast.error(result.message);
                setIsUploading(false);
                return null;
            }
        } else {
            const files = filesToUpload.map(img => img.file);
            const result = await uploadService.uploadMultiple(files, 'products');
            if (result.success) {
                uploadedUrls.push(...result.data.map(img => img.url));
            } else {
                toast.error(result.message);
                setIsUploading(false);
                return null;
            }
        }

        setIsUploading(false);

        // Combine with existing uploaded images
        const existingUrls = imagePreviews
            .filter(img => img.uploaded)
            .map(img => img.url)
            .filter((url) => typeof url === 'string' && url.trim().length > 0);

        const normalizedUploadedUrls = uploadedUrls
            .filter((url) => typeof url === 'string' && url.trim().length > 0);

        if (normalizedUploadedUrls.length !== uploadedUrls.length) {
            toast.error('Một số ảnh upload không trả về URL hợp lệ');
            return null;
        }

        return [...existingUrls, ...normalizedUploadedUrls];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!product && imagePreviews.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 ảnh sản phẩm');
            setIsSubmitting(false);
            return;
        }

        // Upload images first
        const imageUrls = await uploadImages();
        if (imageUrls === null) {
            setIsSubmitting(false);
            return;
        }

        if (!product && imageUrls.length === 0) {
            toast.error('Không có URL ảnh hợp lệ để tạo sản phẩm');
            setIsSubmitting(false);
            return;
        }

        // Get content from TinyMCE
        const description = editorRef.current ? editorRef.current.getContent() : '';

        // Prepare data with correct types according to schema
        const updatedFormData = {
            name: formData.name,
            desc: formData.desc || undefined,
            price: Number(formData.price), // Convert to number
            images: imageUrls && imageUrls.length > 0 ? imageUrls : undefined, // Array of URLs or undefined
            category: formData.category,
            description: description || undefined,
            sku: formData.sku || undefined,
            material: formData.material || undefined,
            dimensions: formData.dimensions || undefined,
            color: formData.color || undefined,
            warranty: formData.warranty || undefined,
            stock: formData.stock ? Number(formData.stock) : undefined, // Convert to number or undefined
        };

        const saveResult = await onSave(updatedFormData);
        if (saveResult?.success) {
            onClose();
        }

        setIsSubmitting(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container product-modal">
                <div className="modal-header">
                    <h2>{product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Hình ảnh sản phẩm (Tối đa 10 ảnh, mỗi ảnh &lt; 5MB)</label>
                            <div className="image-upload-container">
                                {imagePreviews.length > 0 && (
                                    <div className="image-preview-grid">
                                        {imagePreviews.map((img, index) => (
                                            <div key={index} className="image-preview-item">
                                                <img src={img.preview} alt={`Preview ${index + 1}`} />
                                                <button
                                                    type="button"
                                                    className="remove-image-btn"
                                                    onClick={() => handleRemoveImage(index)}
                                                >
                                                    <X size={16} />
                                                </button>
                                                {index === 0 && <div className="primary-badge">Ảnh chính</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {imagePreviews.length < 10 && (
                                    <label className="image-upload-area" htmlFor="product-images">
                                        <input
                                            id="product-images"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageSelect}
                                            style={{ display: 'none' }}
                                        />
                                        <Upload size={32} />
                                        <p>Kéo thả hoặc click để tải ảnh</p>
                                        <span className="upload-hint">JPG, PNG, GIF, WEBP - Tối đa 5MB</span>
                                    </label>
                                )}

                                {isUploading && (
                                    <div className="upload-progress">
                                        <Loader className="spinner" size={20} />
                                        <span>Đang upload ảnh...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Tên sản phẩm *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nhập tên sản phẩm"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Danh mục *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">Chọn danh mục</option>
                                {CATEGORY_LIST.map(slug => (
                                    <option key={slug} value={slug}>{CATEGORIES[slug]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Giá bán (VNĐ) *</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="Nhập giá bán"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Chất liệu</label>
                            <input
                                type="text"
                                value={formData.material || ''}
                                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                placeholder="VD: Gỗ tự nhiên, Vải, Da, Kim loại..."
                            />
                        </div>
                        <div className="form-group">
                            <label>SKU</label>
                            <input
                                type="text"
                                value={formData.sku || ''}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Mã sản phẩm (SKU)"
                            />
                        </div>
                        <div className="form-group">
                            <label>Kích thước</label>
                            <input
                                type="text"
                                value={formData.dimensions || ''}
                                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                                placeholder="VD: 120 x 60 x 75 cm"
                            />
                        </div>
                        <div className="form-group">
                            <label>Màu sắc</label>
                            <input
                                type="text"
                                value={formData.color || ''}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                placeholder="Nhập màu sắc"
                            />
                        </div>
                        <div className="form-group">
                            <label>Bảo hành</label>
                            <input
                                type="text"
                                value={formData.warranty || ''}
                                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                                placeholder="VD: 12 tháng"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Mô tả ngắn</label>
                            <input
                                type="text"
                                value={formData.desc || ''}
                                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                                placeholder="Mô tả ngắn gọn về sản phẩm"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Mô tả chi tiết</label>
                            <Editor
                                key={product ? product.id : 'new'}
                                onInit={(evt, editor) => editorRef.current = editor}
                                initialValue={product ? product.description : ''}
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                init={{
                                    license_key: 'gpl',
                                    promotion: false,
                                    branding: false,
                                    height: 400,
                                    menubar: false,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                        'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                                    ],
                                    toolbar: 'undo redo | blocks | ' +
                                        'bold italic forecolor | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                    placeholder: 'Nhập mô tả chi tiết sản phẩm...'
                                }}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isUploading || isSubmitting}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-primary" disabled={isUploading || isSubmitting}>
                            {isUploading || isSubmitting ? (
                                <>
                                    <Loader className="spinner" size={16} />
                                    {isUploading ? 'Đang upload...' : 'Đang lưu...'}
                                </>
                            ) : (
                                product ? 'Cập nhật' : 'Thêm sản phẩm'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, productName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container delete-modal">
                <div className="modal-header">
                    <h2>Xác nhận xóa</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="delete-warning">
                        <Trash2 size={48} />
                        <p>Bạn có chắc chắn muốn xóa sản phẩm <strong>"{productName}"</strong>?</p>
                        <span>Hành động này không thể hoàn tác.</span>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Hủy
                    </button>
                    <button className="btn-danger" onClick={onConfirm}>
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductViewModal = ({ isOpen, onClose, product, formatPrice, getStatusLabel }) => {
    if (!isOpen || !product) return null;

    const detailImages = product.images && product.images.length > 0
        ? product.images.map((img) => getImageUrl(img))
        : [product.image];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container product-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi tiết sản phẩm</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
                        <div className="full-width">
                            <h3 style={{ fontSize: '1.1rem', color: '#2c2e53', marginBottom: '0.75rem' }}>{product.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                <span style={{ background: '#f8f3eb', color: '#bd945f', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>{CATEGORIES[product.category] || product.category}</span>
                                <span style={{ background: '#f5f5f5', color: '#555', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>{getStatusLabel(product.status)}</span>
                            </div>
                        </div>

                        <div className="full-width" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                            {detailImages.map((img, index) => (
                                <div key={`${img}-${index}`} style={{ border: '1px solid #eee', overflow: 'hidden', background: '#fafafa' }}>
                                    <img src={img} alt={`${product.name}-${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>

                        <div>
                            <strong>Giá bán:</strong>
                            <p style={{ color: '#bd945f', fontWeight: 700, marginTop: '0.25rem' }}>{formatPrice(product.price)}</p>
                        </div>
                        <div>
                            <strong>Tồn kho:</strong>
                            <p style={{ marginTop: '0.25rem' }}>{product.stock ?? 0}</p>
                        </div>
                        <div>
                            <strong>SKU:</strong>
                            <p style={{ marginTop: '0.25rem' }}>{product.sku || '-'}</p>
                        </div>
                        <div>
                            <strong>Chất liệu:</strong>
                            <p style={{ marginTop: '0.25rem' }}>{product.material || '-'}</p>
                        </div>
                        <div>
                            <strong>Kích thước:</strong>
                            <p style={{ marginTop: '0.25rem' }}>{product.dimensions || '-'}</p>
                        </div>
                        <div>
                            <strong>Màu sắc:</strong>
                            <p style={{ marginTop: '0.25rem' }}>{product.color || '-'}</p>
                        </div>
                        <div className="full-width">
                            <strong>Mô tả ngắn:</strong>
                            <p style={{ marginTop: '0.35rem', color: '#666' }}>{product.desc || '-'}</p>
                        </div>
                        <div className="full-width">
                            <strong>Mô tả chi tiết:</strong>
                            <div
                                style={{ marginTop: '0.5rem', padding: '0.75rem', border: '1px solid #eee', background: '#fafafa', maxHeight: '220px', overflow: 'auto' }}
                                dangerouslySetInnerHTML={{ __html: product.description || '<p>-</p>' }}
                            />
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

// Product Card Component
const ProductCard = ({ product, viewMode, onEdit, onDelete, onView, formatPrice }) => {
    return (
        <div className={`product-card ${viewMode === 'list' ? 'list-view' : ''}`}>
            <div className="product-card-image">
                <img src={product.image} alt={product.name} />
            </div>
            <div className="product-card-content">
                <span className="product-card-category">{product.category}</span>
                <h3 className="product-card-name">{product.name}</h3>
                <p className="product-card-description">{product.description}</p>
                <div className="product-card-price">{formatPrice(product.price)}</div>
                {/* <div className="product-card-stats">
                    <div className="stat-item">
                        <Package size={14} />
                        <span>Kho: <strong className={product.stock === 0 ? 'out-of-stock' : product.stock <= 5 ? 'low-stock' : ''}>{product.stock}</strong></span>
                    </div>
                    <div className="stat-item">
                        <ShoppingCart size={14} />
                        <span>Đã bán: <strong>{product.sold}</strong></span>
                    </div>
                </div> */}
            </div>
            <div className="product-card-actions">
                <button className="card-action-btn view" onClick={() => onView(product)} title="Xem chi tiết">
                    <Eye size={16} />
                </button>
                <button className="card-action-btn edit" onClick={() => onEdit(product)} title="Chỉnh sửa">
                    <Edit size={16} />
                </button>
                <button className="card-action-btn delete" onClick={() => onDelete(product)} title="Xóa">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

const AdminProducts = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [viewProduct, setViewProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        const result = await productService.getAllProducts();
        if (result.success) {
            const formattedProducts = result.data.map(p => ({
                id: p._id,
                name: p.name,
                category: p.category,
                price: p.price,
                stock: p.stock,
                status: p.stock > 0 ? 'active' : 'out_of_stock',
                description: p.desc || p.description,
                sold: 0,
                ...p,
                image: getImageUrl(p.images && p.images[0] ? p.images[0] : p.image),
            }));
            setProducts(formattedProducts);
        }
        setIsLoading(false);
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            active: 'Đang bán',
            inactive: 'Ngừng bán',
            out_of_stock: 'Hết hàng'
        };
        return statusLabels[status] || status;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setIsFormModalOpen(true);
    };

    const handleEditProduct = (product) => {
        openProductDetailsForEdit(product);
    };

    const handleViewProduct = (product) => {
        openProductDetailsForView(product);
    };

    const openProductDetailsForEdit = async (product) => {
        try {
            const detailResult = await productService.getProductById(product.id);
            if (detailResult.success && detailResult.data) {
                const detail = detailResult.data;
                const mergedProduct = {
                    ...product,
                    ...detail,
                    id: detail._id || product.id,
                    image: getImageUrl(detail.images && detail.images[0] ? detail.images[0] : detail.image || product.image),
                };
                setSelectedProduct(mergedProduct);
            } else {
                setSelectedProduct(product);
                toast.error(detailResult.message || 'Không thể tải chi tiết sản phẩm');
            }
        } catch (error) {
            setSelectedProduct(product);
            toast.error('Không thể tải chi tiết sản phẩm');
        }
        setIsFormModalOpen(true);
    };

    const openProductDetailsForView = async (product) => {
        try {
            const detailResult = await productService.getProductById(product.id);
            if (detailResult.success && detailResult.data) {
                const detail = detailResult.data;
                const mergedProduct = {
                    ...product,
                    ...detail,
                    id: detail._id || product.id,
                    image: getImageUrl(detail.images && detail.images[0] ? detail.images[0] : detail.image || product.image),
                };
                setViewProduct(mergedProduct);
            } else {
                setViewProduct(product);
                toast.error(detailResult.message || 'Không thể tải chi tiết sản phẩm');
            }
        } catch (error) {
            setViewProduct(product);
            toast.error('Không thể tải chi tiết sản phẩm');
        }
        setIsViewModalOpen(true);
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            const result = await productService.deleteProduct(productToDelete.id);
            if (result.success) {
                toast.success('Xóa sản phẩm thành công');
                fetchProducts();
            } else {
                toast.error(result.message || 'Xóa thất bại');
            }
        } catch (error) {
            toast.error('Đã có lỗi xảy ra');
        }
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
    };

    const handleSaveProduct = async (productData) => {
        try {
            let result;
            if (selectedProduct) {
                result = await productService.updateProduct(selectedProduct.id, productData);
            } else {
                result = await productService.createProduct(productData);
            }

            if (result.success) {
                toast.success(result.message || (selectedProduct ? 'Cập nhật thành công' : 'Thêm sản phẩm thành công'));
                fetchProducts();
                return { success: true };
            } else {
                toast.error(result.message || 'Thất bại');
                return { success: false };
            }
        } catch (error) {
            toast.error('Đã có lỗi xảy ra');
            return { success: false };
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesStatus = !statusFilter || product.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const itemsPerPage = 9; // 3 cards per row x 3 rows
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="admin-products">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Quản lý sản phẩm</h1>
                    <p className="page-subtitle">Quản lý tất cả sản phẩm nội thất trong cửa hàng</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-primary" onClick={handleAddProduct}>
                        <Plus size={18} />
                        Thêm sản phẩm
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tất cả danh mục</option>
                        {CATEGORY_LIST.map(slug => (
                            <option key={slug} value={slug}>{CATEGORIES[slug]}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang bán</option>
                        <option value="inactive">Ngừng bán</option>
                        <option value="out_of_stock">Hết hàng</option>
                    </select>
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Xem dạng lưới"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="Xem dạng danh sách"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>Đang tải sản phẩm...</p>
                </div>
            ) : (
                <>
                    <div className={`products-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                        {paginatedProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                viewMode={viewMode}
                                onEdit={handleEditProduct}
                                onDelete={handleDeleteClick}
                                onView={handleViewProduct}
                                formatPrice={formatPrice}
                            />
                        ))}
                    </div>

                    {/* Empty State */}
                    {paginatedProducts.length === 0 && (
                        <div className="empty-state">
                            <Package size={64} />
                            <h3>Không tìm thấy sản phẩm</h3>
                            <p>Thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="products-pagination">
                            <div className="pagination-info">
                                Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} trong tổng số {filteredProducts.length} sản phẩm
                            </div>
                            <div className="pagination-buttons">
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <ProductFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                product={selectedProduct}
                onSave={handleSaveProduct}
            />
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                productName={productToDelete?.name}
            />
            <ProductViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewProduct(null);
                }}
                product={viewProduct}
                formatPrice={formatPrice}
                getStatusLabel={getStatusLabel}
            />
        </div>
    );
};

export default AdminProducts;
