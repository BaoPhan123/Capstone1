import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Loader, Image as ImageIcon, X, Newspaper, ChevronDown } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import newsService from '../../services/newsService';
import uploadService from '../../services/uploadService';
import { toast } from 'sonner';
import { getImageUrl } from '../../lib/utils';

const AdminNews = () => {
    const [news, setNews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    // TinyMCE editor ref
    const editorRef = useRef(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: '',
        shortDescription: '',
        thumbnail: '',
        author: '',
        tags: '',
    });
    const [thumbnailPreview, setThumbnailPreview] = useState('');

    useEffect(() => {
        fetchNews();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const result = await newsService.getNewsCategories();
        if (result.success) {
            setCategories(result.data || []);
        }
    };

    const fetchNews = async () => {
        setIsLoading(true);
        const result = await newsService.getAllNews(1, 100);
        if (result.success) {
            setNews(result.data || []);
        } else {
            toast.error(result.message);
        }
        setIsLoading(false);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }

        setIsCreatingCategory(true);
        const result = await newsService.createNewsCategory({ name: newCategoryName.trim() });
        setIsCreatingCategory(false);

        if (result.success) {
            toast.success(result.message || 'Tạo danh mục thành công');
            setNewCategoryName('');
            await fetchCategories();
        } else {
            toast.error(result.message || 'Tạo danh mục thất bại');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validation = uploadService.validateImage(file);
        if (!validation.valid) {
            toast.error(validation.message);
            return;
        }

        const previewData = await uploadService.createImagePreview(file);
        if (previewData) {
            setThumbnailPreview(previewData.preview);
        }

        setIsUploadingImage(true);
        const uploadResult = await uploadService.uploadSingle(file, 'news');
        setIsUploadingImage(false);

        if (uploadResult.success) {
            const uploadedUrl = uploadResult.data?.url || '';
            setFormData(prev => ({ ...prev, thumbnail: uploadedUrl }));
            setThumbnailPreview(getImageUrl(uploadedUrl));
            toast.success('Tải ảnh thành công');
        } else {
            toast.error(uploadResult.message || 'Tải ảnh thất bại');
            setFormData(prev => ({ ...prev, thumbnail: '' }));
            setThumbnailPreview('');
        }

        e.target.value = '';
    };

    const clearThumbnail = () => {
        setFormData(prev => ({ ...prev, thumbnail: '' }));
        setThumbnailPreview('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (isUploadingImage) {
            toast.error('Vui lòng chờ upload ảnh hoàn tất');
            return;
        }

        if (!formData.title || !formData.category) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        // Get content from TinyMCE
        const content = editorRef.current ? editorRef.current.getContent() : '';
        if (!content || content.trim() === '' || content.trim() === '<p></p>') {
            toast.error('Vui lòng nhập nội dung bài viết');
            return;
        }

        setIsSubmitting(true);

        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

        const newsData = {
            title: formData.title,
            slug: formData.slug,
            category: formData.category,
            desc: formData.shortDescription,
            author: formData.author,
            content,
            tags: tagsArray,
            ...(formData.thumbnail ? { image: formData.thumbnail } : {}),
        };

        let result;
        if (editingNews) {
            result = await newsService.updateNews(editingNews.slug, newsData);
        } else {
            result = await newsService.createNews(newsData);
        }

        if (result.success) {
            toast.success(editingNews ? 'Cập nhật tin tức thành công' : 'Tạo tin tức thành công');
            setShowModal(false);
            resetForm();
            fetchNews();
        } else {
            toast.error(result.message);
        }

        setIsSubmitting(false);
    };

    const handleEdit = (item) => {
        setEditingNews(item);
        setFormData({
            title: item.title,
            slug: item.slug,
            category: item.category,
            shortDescription: item.desc || '',
            thumbnail: item.image,
            author: item.author || '',
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
        });
        setThumbnailPreview(getImageUrl(item.image));
        setShowModal(true);
    };

    const handleDelete = async (slug) => {
        if (!confirm('Bạn có chắc muốn xóa tin tức này?')) return;

        const result = await newsService.deleteNews(slug);
        if (result.success) {
            toast.success('Xóa tin tức thành công');
            fetchNews();
        } else {
            toast.error(result.message);
        }
    };

    const resetForm = () => {
        setEditingNews(null);
        setFormData({
            title: '',
            slug: '',
            category: '',
            shortDescription: '',
            thumbnail: '',
            author: '',
            tags: '',
        });
        setThumbnailPreview('');
        setIsUploadingImage(false);
        // TinyMCE will be reset when modal reopens
    };

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="admin-content">
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', background: '#bd945f', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Newspaper size={20} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Quản lý tin tức</h1>
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Quản lý nội dung tin tức và bài viết</p>
                    </div>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Plus size={18} />
                    Thêm tin tức
                </button>
            </div>

            {/* Stats + Filters Bar */}
            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #f0f0f0', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tiêu đề..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 32px', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '0.875rem', outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Category filter */}
                <div style={{ position: 'relative', minWidth: '180px' }}>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 2rem 0.55rem 0.75rem', border: '1px solid #e8e8e8', borderRadius: '6px', fontSize: '0.875rem', appearance: 'none', background: '#fafafa', color: categoryFilter ? '#1a1a2e' : '#aaa', outline: 'none', cursor: 'pointer' }}
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Count badge */}
                <div style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#f5f0ea', color: '#bd945f', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {filteredNews.length} bài viết
                    </span>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #f0f0f0', padding: '0.9rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.85rem', color: '#555' }}>Danh mục tin tức:</strong>
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nhập tên danh mục mới"
                    style={{ minWidth: '220px', flex: '1', maxWidth: '340px', padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.85rem' }}
                />
                <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                >
                    {isCreatingCategory ? 'Đang thêm...' : 'Thêm danh mục'}
                </button>
            </div>

            {/* News Table */}
            {isLoading ? (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #f0f0f0', padding: '4rem', textAlign: 'center', color: '#aaa' }}>
                    <Loader className="animate-spin" size={32} style={{ margin: '0 auto 0.75rem', display: 'block', color: '#bd945f' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Đang tải dữ liệu...</p>
                </div>
            ) : filteredNews.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #f0f0f0', padding: '4rem', textAlign: 'center', color: '#aaa' }}>
                    <Newspaper size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>Không có bài viết nào</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>Hãy tạo bài viết đầu tiên</p>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fb', borderBottom: '1px solid #f0f0f0' }}>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', width: '80px' }}>Ảnh</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tiêu đề</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', width: '160px' }}>Danh mục</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', width: '130px' }}>Tác giả</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', width: '110px' }}>Ngày tạo</th>
                                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNews.map((item, index) => (
                                <tr key={item._id} style={{ borderBottom: index < filteredNews.length - 1 ? '1px solid #f5f5f5' : 'none', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fdfaf7'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <div style={{ width: '70px', height: '46px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                            <img src={getImageUrl(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <p style={{ fontWeight: 600, color: '#1a1a2e', margin: '0 0 0.2rem', fontSize: '0.875rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                                        {item.desc && <p style={{ margin: 0, fontSize: '0.75rem', color: '#999', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>}
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <span style={{ display: 'inline-block', padding: '0.25rem 0.65rem', background: '#f0f7ff', color: '#3b82f6', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {item.categoryLabel || item.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.875rem', color: '#555' }}>
                                        {item.author || 'Admin'}
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: '#888' }}>
                                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td style={{ padding: '0.85rem 1.25rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                title="Chỉnh sửa"
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #e8e8e8', background: '#fff', cursor: 'pointer', color: '#555', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#bd945f'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#bd945f'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#e8e8e8'; }}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.slug)}
                                                title="Xóa"
                                                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', border: '1px solid #e8e8e8', background: '#fff', cursor: 'pointer', color: '#555', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#e8e8e8'; }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingNews ? 'Cập nhật tin tức' : 'Thêm tin tức mới'}</h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Tiêu đề <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="Auto-generated nếu để trống"
                                    />
                                </div>
                            </div>

                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Danh mục <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        required
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Tác giả</label>
                                    <input
                                        type="text"
                                        value={formData.author}
                                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                        placeholder="Tên tác giả"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Mô tả ngắn</label>
                                <textarea
                                    value={formData.shortDescription}
                                    onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                                    rows={3}
                                    placeholder="Mô tả ngắn gọn về bài viết"
                                />
                            </div>

                            <div className="form-group">
                                <label>Ảnh đại diện</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {thumbnailPreview && (
                                        <div style={{ position: 'relative' }}>
                                            <img src={thumbnailPreview} alt="Preview" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                            <button
                                                type="button"
                                                onClick={clearThumbnail}
                                                style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <label style={{ padding: '0.75rem 1.5rem', background: '#f0f0f0', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>
                                        <ImageIcon size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                                        {isUploadingImage ? 'Đang tải ảnh...' : 'Chọn ảnh'}
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                    {isUploadingImage && <Loader className="animate-spin" size={16} />}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tags (phân cách bằng dấu phẩy)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    placeholder="vd: nội thất, thiết kế, phòng khách"
                                />
                            </div>

                            <div className="form-group">
                                <label>Nội dung <span style={{ color: 'red' }}>*</span></label>
                                <Editor
                                    key={editingNews ? editingNews._id : 'new'}
                                    onInit={(evt, editor) => editorRef.current = editor}
                                    initialValue={editingNews ? editingNews.content : ''}
                                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                                    init={{
                                        license_key: 'gpl',
                                        promotion: false,
                                        branding: false,
                                        height: 500,
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
                                        placeholder: 'Nhập nội dung bài viết...'
                                    }}
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Hủy
                                </button>
                                <button type="submit" disabled={isSubmitting || isUploadingImage} className="btn-primary">
                                    {isSubmitting && <Loader className="animate-spin" size={16} />}
                                    {editingNews ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNews;
