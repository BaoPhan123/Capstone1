import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Facebook, Twitter, Share2 } from 'lucide-react';
import newsService from '../services/newsService';
import { getImageUrl } from '../lib/utils';

// Image paths từ public folder
const tintuc5Img = '/images/AnhCat/tintuc-5.png';
const tintuc6Img = '/images/AnhCat/tintuc-6.png';
const tintuc4Img = '/images/AnhCat/tintuc-4.png';

const NewsDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState(null);
    const [relatedNews, setRelatedNews] = useState([]);
    const [recentNews, setRecentNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNewsDetail = async () => {
            setIsLoading(true);
            const result = await newsService.getNewsBySlug(slug);
            if (result.success) {
                const newsData = result.data;
                setNews({
                    id: newsData._id,
                    title: newsData.title,
                    desc: newsData.desc,
                    image: getImageUrl(newsData.image),
                    slug: newsData.slug,
                    author: newsData.author?.name || newsData.author,
                    date: new Date(newsData.createdAt).toLocaleDateString('vi-VN'),
                    category: newsData.category,
                    categoryLabel: newsData.categoryLabel || newsData.category,
                    content: newsData.content
                });

                const relatedResult = await newsService.getNewsByCategory(newsData.category, 4);
                if (relatedResult.success) {
                    setRelatedNews(
                        relatedResult.data
                            .filter(n => n.slug !== newsData.slug)
                            .slice(0, 3)
                            .map(n => ({
                                id: n._id,
                                title: n.title,
                                desc: n.desc,
                                image: getImageUrl(n.image),
                                slug: n.slug,
                                date: new Date(n.createdAt).toLocaleDateString('vi-VN')
                            }))
                    );
                }

                const allNewsResult = await newsService.getAllNews(1, 6);
                if (allNewsResult.success) {
                    setRecentNews(
                        allNewsResult.data
                            .filter(n => n.slug !== newsData.slug)
                            .slice(0, 5)
                            .map(n => ({
                                id: n._id,
                                title: n.title,
                                image: getImageUrl(n.image),
                                slug: n.slug,
                                date: new Date(n.createdAt).toLocaleDateString('vi-VN')
                            }))
                    );
                }

                const categoryResult = await newsService.getNewsCategories();
                if (categoryResult.success) {
                    setCategories(categoryResult.data || []);
                }
            }
            setIsLoading(false);
        };
        fetchNewsDetail();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="news-detail-page">
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>Đang tải bài viết...</p>
                </div>
            </div>
        );
    }

    if (!news) {
        return (
            <div className="not-found-page">
                <div className="container mx-auto px-4 text-center py-20">
                    <h1>Bài viết không tồn tại</h1>
                    <p>Xin lỗi, bài viết bạn tìm kiếm không tồn tại.</p>
                    <Link to="/news" className="btn-back">Quay lại tin tức</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="news-detail-page">
            {/* Back Button */}
            <div className="back-nav container mx-auto px-4">
                <button onClick={() => navigate(-1)} className="btn-go-back">
                    <ArrowLeft size={18} />
                    Quay lại
                </button>
            </div>

            {/* News Content */}
            <section className="news-detail-content">
                <div className="container mx-auto px-4">
                    <div className="news-detail-layout">
                        {/* Main Content */}
                        <article className="news-article">
                            <div className="article-header">
                                <span className="article-category">{news.categoryLabel}</span>
                                <h1 className="article-title">{news.title}</h1>
                                <div className="article-meta">
                                    <span className="meta-item">
                                        <User size={16} />
                                        {news.author}
                                    </span>
                                    <span className="meta-item">
                                        <Calendar size={16} />
                                        {news.date}
                                    </span>
                                </div>
                            </div>

                            <div className="article-featured-image">
                                <img src={news.image} alt={news.title} />
                            </div>

                            <div
                                className="article-content editor-content"
                                dangerouslySetInnerHTML={{ __html: news.content }}
                            />

                            {/* Share Buttons */}
                            <div className="article-share">
                                <span>Chia sẻ:</span>
                                <div className="share-buttons">
                                    <button className="share-btn facebook">
                                        <Facebook size={18} />
                                    </button>
                                    <button className="share-btn twitter">
                                        <Twitter size={18} />
                                    </button>
                                    <button className="share-btn copy">
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="article-nav">
                                <Link to="/news" className="btn-back-news">
                                    <ArrowLeft size={18} />
                                    Quay lại tin tức
                                </Link>
                            </div>
                        </article>

                        {/* Sidebar */}
                        <aside className="news-sidebar">
                            {/* Recent Posts */}
                            <div className="sidebar-widget">
                                <h3 className="widget-title">Bài viết gần đây</h3>
                                <ul className="recent-posts">
                                    {recentNews.map((item) => (
                                        <li key={item.id} className="recent-post-item">
                                            <Link to={`/news/${item.slug}`}>
                                                <div className="post-thumb">
                                                    <img src={item.image} alt={item.title} />
                                                </div>
                                                <div className="post-info">
                                                    <h4>{item.title}</h4>
                                                    <span className="post-date">
                                                        <Calendar size={12} />
                                                        {item.date}
                                                    </span>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Categories */}
                            <div className="sidebar-widget">
                                <h3 className="widget-title">Danh mục</h3>
                                <ul className="category-links">
                                    {categories.map((cat) => (
                                        <li key={cat._id}>
                                            <Link to={`/news?category=${encodeURIComponent(cat.slug)}`}>{cat.name}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    </div>

                    {/* Related News */}
                    {relatedNews.length > 0 && (
                        <div className="related-news">
                            <h2>Bài viết liên quan</h2>
                            <div className="related-news-grid">
                                {relatedNews.map((item) => (
                                    <div key={item.id} className="news-card">
                                        <div className="news-image">
                                            <img src={item.image} alt={item.title} />
                                            <Link to={`/news/${item.slug}`} className="news-overlay">
                                                <span>Đọc thêm</span>
                                            </Link>
                                        </div>
                                        <div className="news-info">
                                            <span className="news-date">
                                                <Calendar size={14} />
                                                {item.date}
                                            </span>
                                            <h3>
                                                <Link to={`/news/${item.slug}`}>{item.title}</Link>
                                            </h3>
                                            <p>{item.desc}</p>
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

export default NewsDetailPage;
