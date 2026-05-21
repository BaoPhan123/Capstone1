import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Minimize2, RotateCcw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { axiosAuthClient } from '../lib/axios';

const LogoIcon = ({ size = 'normal' }) => (
    <span className={`chatbot-logo-icon ${size}`}>N</span>
);

// Markdown Renderer - hiển thị markdown đầy đủ (heading, list, bold, table...)
const MarkdownText = ({ text }) => {
    if (!text) return null;

    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h4>{children}</h4>,
                    h2: ({ children }) => <h4>{children}</h4>,
                    h3: ({ children }) => <h5>{children}</h5>,
                    p: ({ children }) => <p>{children}</p>,
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer">
                            {children}
                        </a>
                    )
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
};

// Product Card Component
const ProductCard = ({ product, onSelect }) => {
    return (
        <div
            className="product-card-mini"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(product)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(product);
                }
            }}
        >
            {product.image && (
                <div className="product-image">
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                    />
                </div>
            )}
            <div className="product-info">
                <h5>{product.name}</h5>
                <p className="product-category">{product.category}</p>
                <p className="product-price">
                    {product.price?.toLocaleString('vi-VN')}đ
                </p>
            </div>
        </div>
    );
};

const Chatbot = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const user = auth?.user;
    const userId = user?._id || user?.id;
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [guestAskedInfo, setGuestAskedInfo] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const createGreetingMessage = () => ({
        id: 0,
        type: 'bot',
        text: 'Xin chào! Mình là trợ lý ảo của Nestora. Mình có thể tư vấn sản phẩm, gợi ý theo nhu cầu và giúp bạn chọn món phù hợp.',
        products: [],
        time: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    });

    // Load chat history on component mount
    useEffect(() => {
        if (isOpen && userId) {
            loadChatHistory();
        } else if (isOpen && !userId) {
            // Guest mode: allow chat UI but handle messages locally
            setMessages([
                {
                    id: 0,
                    type: 'bot',
                    text: 'Xin chào! Mình là Nestora Assistant.\n\nBạn có thể chat để được tư vấn nhanh. Lưu ý: để xem đơn hàng, lưu giỏ hàng và mua nhanh, bạn nên **đăng nhập** nhé.',
                    products: [],
                    time: new Date().toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }
            ]);
            setGuestAskedInfo(false);
        }
    }, [isOpen, userId]);

    useEffect(() => {
        const handleChatReset = () => {
            setMessages([createGreetingMessage()]);
            setError(null);
            setInputValue('');
        };

        window.addEventListener('nestora:chat-reset', handleChatReset);
        return () => window.removeEventListener('nestora:chat-reset', handleChatReset);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);
    const loadChatHistory = async () => {
        try {
            setIsLoading(true);
            const response = await axiosAuthClient.get('/api/chatbot/history', {
                params: { userId }
            });
            const data = response.data;

            if (data.messages && data.messages.length > 0) {
                const productCache = new Map();

                const hydrateProducts = async (productRefs = []) => {
                    if (!Array.isArray(productRefs) || productRefs.length === 0) return [];

                    const normalizedIds = [...new Set(productRefs
                        .map((item) => {
                            if (typeof item === 'string') return item;
                            return item?.id || item?._id;
                        })
                        .filter(Boolean))].slice(0, 5);

                    const products = [];

                    for (const productId of normalizedIds) {
                        if (productCache.has(productId)) {
                            products.push(productCache.get(productId));
                            continue;
                        }

                        try {
                            const productResponse = await axiosAuthClient.get(`/api/chatbot/product/${productId}`);
                            const product = productResponse.data?.product;
                            if (!product) continue;

                            const mappedProduct = {
                                id: product.id || product._id || productId,
                                name: product.name,
                                price: product.price,
                                category: product.category,
                                image: product.images?.[0] || ''
                            };

                            productCache.set(productId, mappedProduct);
                            products.push(mappedProduct);
                        } catch {
                            // Ignore product fetch errors and keep rendering text message.
                        }
                    }

                    return products;
                };

                const formattedMessages = await Promise.all(data.messages.map(async (msg, idx) => ({
                    id: idx,
                    type: msg.role === 'user' ? 'user' : 'bot',
                    text: msg.content,
                    products: await hydrateProducts(msg.metadata?.productsShown || []),
                    time: new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                })));
                setMessages(formattedMessages);
            } else {
                // First time, show greeting
                setMessages([
                    {
                        id: 0,
                        type: 'bot',
                        text: 'Xin chào! 👋 Tôi là trợ lý ảo của Nestora. Tôi có thể giúp gì cho bạn hôm nay?\n\nTôi có thể:\n- Tìm kiếm và tư vấn sản phẩm\n- Gợi ý sản phẩm phù hợp với phong thủy/phong cách\n- Kiểm tra trạng thái đơn hàng\n- Trả lời các câu hỏi về sản phẩm',
                        products: [],
                        time: new Date().toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    }
                ]);
            }
        } catch (err) {
            console.error('Lỗi tải lịch sử chat:', err);
            setMessages([
                {
                    id: 0,
                    type: 'bot',
                    text: '❌ Không thể tải lịch sử chat. Vui lòng thử lại.',
                    products: [],
                    time: new Date().toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (text = inputValue) => {
        if (!text.trim()) return;

        setError(null);

        const userMessage = {
            id: messages.length,
            type: 'user',
            text: text.trim(),
            products: [],
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Guest flow: ask for basic info on the first message, then encourage login.
            if (window.__NESTORA_DISABLE_GUEST_AI__ && !userId) {
                const botText = !guestAskedInfo
                    ? 'Mình có thể tư vấn tốt hơn nếu bạn cho mình xin một vài thông tin nhé:\n\n- Bạn tên gì?\n- Bạn ở khu vực nào (tỉnh/thành)?\n- Bạn đang tìm sản phẩm cho phòng nào và ngân sách khoảng bao nhiêu?\n\nNgoài ra, bạn có thể **đăng nhập** để mình hỗ trợ mua hàng nhanh, lưu sản phẩm yêu thích và theo dõi đơn hàng.'
                    : 'Để mình tư vấn và hỗ trợ mua hàng/giỏ hàng chính xác hơn, bạn vui lòng **đăng nhập** nhé. Sau khi đăng nhập, bạn nhắn lại nhu cầu (phòng, kích thước, ngân sách) là mình gợi ý ngay.';

                const botMessage = {
                    id: messages.length + 1,
                    type: 'bot',
                    text: botText,
                    products: [],
                    time: new Date().toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                };

                setGuestAskedInfo(true);
                setMessages(prev => [...prev, botMessage]);
                return;
            }

            const response = await axiosAuthClient.post('/api/chatbot/send', {
                message: text.trim(),
                userId,
                history: messages.map((message) => ({
                    role: message.type === 'bot' ? 'assistant' : 'user',
                    content: message.text
                }))
            });

            const data = response.data;

            if (data.error) {
                throw new Error(data.error);
            }

            const botMessage = {
                id: messages.length + 1,
                type: 'bot',
                text: data.reply || 'Không nhận được phản hồi',
                products: data.products || [],
                time: new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error('Lỗi gửi tin nhắn:', err);
            setError(err.message || 'Lỗi khi gửi tin nhắn');

            const errorMessage = {
                id: messages.length + 1,
                type: 'bot',
                text: `❌ ${err.message}. Vui lòng thử lại.`,
                products: [],
                time: new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductSelect = (product) => {
        if (!product?.id) return;

        if (userId) {
            navigate(`/products/${product.id}`);
            return;
        }

        const authMessage = {
            id: Date.now(),
            type: 'bot',
            text: `Bạn cần đăng nhập hoặc đăng ký tài khoản để xem chi tiết sản phẩm **${product.name}**.`,
            products: [],
            action: 'auth',
            time: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        setMessages(prev => [...prev, authMessage]);
    };

    const handleResetSession = async () => {
        if (!userId) {
            setMessages([createGreetingMessage()]);
            return;
        }

        try {
            setIsLoading(true);
            const response = await axiosAuthClient.post('/api/chatbot/reset', {
                userId
            });

            const data = response.data;

            if (data.success) {
                setMessages([
                    {
                        id: 0,
                        type: 'bot',
                        text: 'Đã reset chat. Bắt đầu cuộc trò chuyện mới! 👋',
                        products: [],
                        time: new Date().toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    }
                ]);
            }
        } catch (err) {
            console.error('Lỗi reset session:', err);
            setError('Không thể reset chat');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const minimizeChat = () => {
        setIsMinimized(!isMinimized);
    };

    return (
        <div className="chatbot-wrapper">
            {/* Chat Window */}
            {isOpen && (
                <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">
                                <LogoIcon size="large" />
                            </div>
                            <div className="chatbot-header-text">
                                <h4>Nestora Assistant</h4>
                                <span className="chatbot-status">
                                    <span className="status-dot"></span>
                                    Trực tuyến
                                </span>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button
                                onClick={handleResetSession}
                                title="Reset chat"
                                className="chatbot-action-btn"
                                disabled={isLoading}
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button onClick={minimizeChat} className="chatbot-action-btn">
                                <Minimize2 size={18} />
                            </button>
                            <button onClick={toggleChat} className="chatbot-action-btn">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    {!isMinimized && (
                        <>
                            {error && (
                                <div className="chatbot-error-banner">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                    <button
                                        onClick={() => setError(null)}
                                        className="error-close"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            <div className="chatbot-messages">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`chatbot-message ${message.type}`}
                                    >
                                        {message.type === 'bot' && (
                                            <div className="message-avatar bot-avatar">
                                                <LogoIcon size="small" />
                                            </div>
                                        )}
                                        <div className="message-content">
                                            {/* Luôn hiển thị text trả lời, card sản phẩm hiển thị bên dưới */}
                                            {message.text && (
                                                <MarkdownText text={message.text} />
                                            )}
                                            {message.action === 'auth' && (
                                                <div className="chatbot-auth-actions">
                                                    <button type="button" onClick={() => navigate('/login')}>
                                                        Đăng nhập
                                                    </button>
                                                    <button type="button" onClick={() => navigate('/register')}>
                                                        Đăng ký
                                                    </button>
                                                </div>
                                            )}
                                            <span className="message-time">{message.time}</span>

                                            {/* Product Cards */}
                                            {message.products && message.products.length > 0 && (
                                                <div className="message-products">
                                                    {message.products.map((product, idx) => (
                                                        <ProductCard
                                                            key={idx}
                                                            product={product}
                                                            onSelect={handleProductSelect}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {message.type === 'user' && (
                                            <div className="message-avatar user-avatar">
                                                <User size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Loading Indicator */}
                                {isLoading && (
                                    <div className="chatbot-message bot">
                                        <div className="message-avatar bot-avatar">
                                            <LogoIcon size="small" />
                                        </div>
                                        <div className="message-content typing">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="chatbot-input-area">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập tin nhắn..."
                                    className="chatbot-input"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="chatbot-send-btn"
                                    title=""
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={toggleChat}
                className={`chatbot-toggle-btn ${isOpen ? 'active' : ''}`}
                aria-label="Toggle chat"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <>
                        <MessageCircle size={24} />
                        <span className="chatbot-badge">1</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default Chatbot;
