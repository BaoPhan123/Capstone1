import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Minimize2 } from 'lucide-react';

// Logo Icon Component (giống với logo hệ thống)
const LogoIcon = ({ size = 'normal' }) => (
    <span className={`chatbot-logo-icon ${size}`}>N</span>
);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: 'Xin chào! 👋 Tôi là trợ lý ảo của Nestora. Tôi có thể giúp gì cho bạn hôm nay?',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll to bottom when new messages arrive
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

    // Quick reply options
    const quickReplies = [
        'Sản phẩm mới',
        'Hỗ trợ đặt hàng',
        'Chính sách đổi trả',
        'Liên hệ tư vấn'
    ];

    // Simulate bot response
    const getBotResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('sản phẩm') || lowerMessage.includes('mới')) {
            return 'Chúng tôi có nhiều sản phẩm nội thất cao cấp mới nhất. Bạn có thể xem tại mục Sản phẩm trên website hoặc cho tôi biết bạn đang tìm kiếm loại nội thất nào? 🏠';
        } else if (lowerMessage.includes('đặt hàng') || lowerMessage.includes('mua')) {
            return 'Để đặt hàng, bạn chỉ cần chọn sản phẩm yêu thích, thêm vào giỏ hàng và tiến hành thanh toán. Nếu cần hỗ trợ thêm, hãy liên hệ hotline: 1900 xxxx 📞';
        } else if (lowerMessage.includes('đổi trả') || lowerMessage.includes('bảo hành')) {
            return 'Nestora hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Sản phẩm được bảo hành từ 1-5 năm tùy loại. Bạn cần thêm thông tin gì không? 📋';
        } else if (lowerMessage.includes('liên hệ') || lowerMessage.includes('tư vấn')) {
            return 'Bạn có thể liên hệ với chúng tôi qua:\n📞 Hotline: 1900 xxxx\n📧 Email: support@nestora.vn\n🏢 Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM';
        } else if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Chào bạn! Rất vui được hỗ trợ bạn. Bạn cần tìm hiểu về sản phẩm hay dịch vụ nào của Nestora? 😊';
        } else if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank')) {
            return 'Không có gì! Rất vui được hỗ trợ bạn. Nếu cần thêm thông tin gì, đừng ngại hỏi nhé! 🙏';
        } else if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu')) {
            return 'Giá sản phẩm của chúng tôi rất đa dạng. Bạn có thể xem chi tiết giá tại trang Sản phẩm. Bạn đang quan tâm đến loại nội thất nào? 💰';
        } else {
            return 'Cảm ơn bạn đã liên hệ! Tôi sẽ chuyển câu hỏi của bạn đến bộ phận hỗ trợ. Trong khi chờ đợi, bạn có thể tham khảo các mục trên website hoặc gọi hotline: 1900 xxxx 📱';
        }
    };

    const handleSendMessage = (text = inputValue) => {
        if (!text.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: text.trim(),
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Simulate bot typing delay
        setTimeout(() => {
            const botResponse = {
                id: messages.length + 2,
                type: 'bot',
                text: getBotResponse(text),
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000);
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
                                            <p>{message.text}</p>
                                            <span className="message-time">{message.time}</span>
                                        </div>
                                        {message.type === 'user' && (
                                            <div className="message-avatar user-avatar">
                                                <User size={16} />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
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

                            {/* Quick Replies */}
                            {messages.length === 1 && (
                                <div className="chatbot-quick-replies">
                                    {quickReplies.map((reply, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSendMessage(reply)}
                                            className="quick-reply-btn"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            )}

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
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim()}
                                    className="chatbot-send-btn"
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
