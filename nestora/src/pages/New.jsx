import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import newsService from '../services/newsService';
import { getImageUrl } from '../lib/utils';

const ITEMS_PER_PAGE = 6;

const NewsPage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [newsData, setNewsData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

    const selectedCategory = searchParams.get('category') || '';
    const searchKeyword = searchParams.get('q') || '';

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            const result = await newsService.getAllNews(currentPage, ITEMS_PER_PAGE, selectedCategory, searchKeyword);
            if (result.success) {
                const formattedNews = result.data.map(n => ({
                    id: n._id,
                    title: n.title,
                    desc: n.desc,
                    image: getImageUrl(n.image),
                    slug: n.slug,
                    date: new Date(n.createdAt).toLocaleDateString('vi-VN'),
                    category: n.category,
                    categoryLabel: n.categoryLabel || n.category
                }));
                setNewsData(formattedNews);

                setCategories(result.meta?.categories || []);
                setTotalPages(result.meta?.totalPages || 1);
            }
            setIsLoading(false);
        };
        fetchNews();
    }, [currentPage, selectedCategory, searchKeyword]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchKeyword]);

    const applySearchParams = (params) => {
        setSearchParams(params);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const next = {};
        if (selectedCategory) next.category = selectedCategory;
        if (searchInput.trim()) next.q = searchInput.trim();
        applySearchParams(next);
    };

    const handleCategoryFilter = (slug) => {
        const next = {};
        if (slug) next.category = slug;
        if (searchKeyword) next.q = searchKeyword;
        applySearchParams(next);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="bgc">
            <div className="container mx-auto px-4">
                <div className="box-news">
                    <h1 className="header-news">Tin tức</h1>

                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ marginTop: '1rem' }}>Đang tải tin tức...</p>
                        </div>
                    ) : newsData.length === 0 ? (
                        <div className="text-center py-20">
                            <p>Không có tin tức nào.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                                <aside className="bg-white p-5 h-fit sticky top-28">
                                    <div className="filter-section">
                                        <h4>Tìm kiếm</h4>
                                        <form className="search-form" onSubmit={handleSearchSubmit}>
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                placeholder="Nhập từ khóa..."
                                            />
                                            <button type="submit" aria-label="Tìm kiếm tin tức">
                                                <Search size={16} />
                                            </button>
                                        </form>
                                    </div>

                                    <div className="filter-section">
                                        <h4>Danh mục</h4>
                                        <ul className="category-list">
                                            <li>
                                                <button
                                                    className={!selectedCategory ? 'active' : ''}
                                                    onClick={() => handleCategoryFilter('')}
                                                >
                                                    <span>Tất cả</span>
                                                </button>
                                            </li>
                                            {categories.map((cat) => (
                                                <li key={cat._id}>
                                                    <button
                                                        className={selectedCategory === cat.slug ? 'active' : ''}
                                                        onClick={() => handleCategoryFilter(cat.slug)}
                                                    >
                                                        <span>{cat.name}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </aside>

                                <div>
                                    <div className="wrapper-news grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {newsData.map((news) => (
                                            <div key={news.id} className="new-item">
                                                <div className="img">
                                                    <img
                                                        src={news.image}
                                                        className="w-full"
                                                        alt={news.title}
                                                    />
                                                </div>
                                                <div className="title">
                                                    <p style={{ color: '#bd945f', fontSize: '0.75rem', marginBottom: '0.35rem', fontWeight: 600 }}>{news.categoryLabel}</p>
                                                    <h4>
                                                        <Link to={`/news/${news.slug}`}>{news.title}</Link>
                                                    </h4>
                                                    <p className="desc">{news.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination flex justify-center mt-8">
                                    <ul className="flex gap-2">
                                        {[...Array(totalPages)].map((_, index) => (
                                            <li
                                                key={index + 1}
                                                className={`px-4 py-2 cursor-pointer rounded ${currentPage === index + 1
                                                    ? 'active bg-primary text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300'
                                                    }`}
                                                onClick={() => handlePageChange(index + 1)}
                                            >
                                                {index + 1}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsPage;
