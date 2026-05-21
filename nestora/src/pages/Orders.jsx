import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, ChevronRight, Search, Filter, Calendar, Truck, CheckCircle, XCircle, Clock, ArrowLeft, X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import { toast } from 'sonner';
import { getImageUrl } from '../lib/utils';

// Image paths từ public folder
const bannerSanPhamImg = '/images/AnhCat/banner-san-pham.png';
const sp1Img = '/images/AnhCat/sp-1.png';
const sp2Img = '/images/AnhCat/sp-2.png';
const sp3Img = '/images/AnhCat/sp-3.png';

const getOrderItemImage = (item) => {
    return getImageUrl(
        item?.product?.images?.[0]
        || item?.product?.thumbnail
        || item?.image
        || sp1Img
    );
};

const OrdersPage = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [orderDetail, setOrderDetail] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, orderNum: '' });
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (user) {
            fetchOrders();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const fetchOrders = async () => {
        setIsLoading(true);
        const result = await orderService.getMyOrders();
        if (result.success) {
            setOrders(result.data);
        } else {
            toast.error(result.message);
        }
        setIsLoading(false);
    };

    const viewOrderDetail = async (orderId) => {
        setIsLoadingDetail(true);
        setSelectedOrder(orderId);
        const result = await orderService.getOrderDetail(orderId);
        if (result.success) {
            setOrderDetail(result.data);
        } else {
            toast.error(result.message);
            setSelectedOrder(null);
        }
        setIsLoadingDetail(false);
    };

    const openCancelModal = (orderId, orderNum) => {
        setCancelReason('');
        setCancelModal({ open: true, orderId, orderNum });
    };

    const closeCancelModal = () => {
        setCancelModal({ open: false, orderId: null, orderNum: '' });
        setCancelReason('');
    };

    const handleCancelOrder = async () => {
        setIsCancelling(true);
        const result = await orderService.cancelOrder(cancelModal.orderId, cancelReason);
        setIsCancelling(false);
        if (result.success) {
            toast.success('Hủy đơn hàng thành công');
            closeCancelModal();
            fetchOrders();
            if (selectedOrder === cancelModal.orderId) {
                setSelectedOrder(null);
                setOrderDetail(null);
            }
        } else {
            toast.error(result.message);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            pending: { label: 'Chờ xử lý', bgColor: 'bg-amber-100', textColor: 'text-amber-600', icon: Clock },
            confirmed: { label: 'Đã thanh toán', bgColor: 'bg-blue-100', textColor: 'text-blue-600', icon: CheckCircle },
            shipping: { label: 'Đang giao hàng', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600', icon: Truck },
            completed: { label: 'Đã hoàn thành', bgColor: 'bg-green-100', textColor: 'text-green-600', icon: CheckCircle },
            cancelled: { label: 'Đã hủy', bgColor: 'bg-red-100', textColor: 'text-red-600', icon: XCircle }
        };
        return statusMap[status] || statusMap.pending;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        { status: 'pending', label: 'Chờ xử lý', icon: Clock, gradient: 'from-amber-400 to-amber-500', count: orders.filter(o => o.status === 'pending').length },
        { status: 'shipping', label: 'Đang giao', icon: Truck, gradient: 'from-cyan-400 to-cyan-500', count: orders.filter(o => o.status === 'shipping').length },
        { status: 'completed', label: 'Hoàn thành', icon: CheckCircle, gradient: 'from-green-400 to-green-500', count: orders.filter(o => o.status === 'completed' || o.status === 'confirmed').length },
        { status: 'cancelled', label: 'Đã hủy', icon: XCircle, gradient: 'from-red-400 to-red-500', count: orders.filter(o => o.status === 'cancelled').length }
    ];

    if (!user) {
        return (
            <div className="py-12 bg-[#f8f8f8] min-h-screen">
                <div className="container mx-auto px-4">
                    <div className="bg-white shadow-sm p-16 text-center">
                        <Package size={80} className="mx-auto text-gray-300 mb-6" />
                        <h3 className="text-2xl font-semibold text-gray-600 mb-2">Vui lòng đăng nhập</h3>
                        <p className="text-gray-500 mb-8">Bạn cần đăng nhập để xem đơn hàng</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                        >
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="py-12 bg-[#f8f8f8] min-h-screen">
                <div className="container mx-auto px-4">
                    <div className="text-center py-20">
                        <Loader className="mx-auto animate-spin text-[#bd945f]" size={48} />
                        <p className="text-gray-500 mt-4">Đang tải đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Banner */}
            <section className="relative h-[300px] overflow-hidden">
                <img src={bannerSanPhamImg} alt="Đơn hàng của tôi" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 flex items-center">
                    <div className="container mx-auto px-4">
                        <h1 className="text-white text-4xl font-bold mb-4" style={{ fontFamily: 'Gotham-Ultra, sans-serif' }}>
                            Đơn hàng của tôi
                        </h1>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Link to="/" className="hover:text-[#bd945f] transition-colors">Trang chủ</Link>
                            <ChevronRight size={16} />
                            <Link to="/profile" className="hover:text-[#bd945f] transition-colors">Tài khoản</Link>
                            <ChevronRight size={16} />
                            <span className="text-[#bd945f]">Đơn hàng</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Orders Content */}
            <section className="py-12 bg-[#f8f8f8]">
                <div className="container mx-auto px-4">
                    {/* Back to Profile */}
                    <Link to="/profile" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#bd945f] transition-colors mb-8">
                        <ArrowLeft size={18} />
                        Quay lại tài khoản
                    </Link>

                    {/* Order Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {stats.map(stat => {
                            const StatIcon = stat.icon;
                            return (
                                <div key={stat.status} className="bg-white p-5 shadow-sm flex items-center gap-4">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white`}>
                                        <StatIcon size={24} />
                                    </div>
                                    <div>
                                        <span className="text-2xl font-bold text-gray-800">{stat.count}</span>
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="flex-1 flex items-center bg-white border border-gray-200 px-4">
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã đơn hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-3 py-3 border-none outline-none bg-transparent"
                            />
                        </div>
                        <div className="flex items-center bg-white border border-gray-200 px-4">
                            <Filter size={18} className="text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-3 border-none outline-none bg-transparent min-w-[180px]"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Chờ xử lý</option>
                                <option value="confirmed">Đã thanh toán</option>
                                <option value="shipping">Đang giao hàng</option>
                                <option value="completed">Đã hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-6">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div key={order._id} className="bg-white shadow-sm overflow-hidden">
                                        {/* Order Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100 gap-3">
                                            <div className="flex items-center gap-4">
                                                <h3 className="font-semibold text-gray-800">#{order.orderNumber || order._id?.slice(-8)}</h3>
                                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Calendar size={14} />
                                                    {formatDate(order.createdAt || order.date)}
                                                </span>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                                <StatusIcon size={14} />
                                                {statusInfo.label}
                                            </span>
                                        </div>

                                        {/* Order Items */}
                                        <div className="p-6">
                                            {order.items?.slice(0, 2).map((item, index) => (
                                                <div key={item._id || index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-b-0">
                                                    <div className="w-16 h-16 overflow-hidden bg-gray-100 flex-shrink-0">
                                                        <img
                                                            src={getOrderItemImage(item)}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                                                        <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                                                    </div>
                                                    <div className="font-semibold text-[#bd945f]">
                                                        {formatPrice(item.price)}
                                                    </div>
                                                </div>
                                            ))}
                                            {order.items?.length > 2 && (
                                                <p className="text-center text-sm text-gray-500 pt-3">
                                                    + {order.items.length - 2} sản phẩm khác
                                                </p>
                                            )}
                                        </div>

                                        {/* Order Footer */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100 gap-4">
                                            <div className="text-gray-700 w-full sm:w-auto">
                                                <div className="flex items-center gap-2">
                                                    <span>Tổng tiền:</span>
                                                    <strong className="text-lg text-[#bd945f]">{formatPrice(order.totalAmount || order.total)}</strong>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    <strong>Địa chỉ giao hàng:</strong> {order.shippingAddress || user?.address || 'Chưa cập nhật'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => viewOrderDetail(order._id)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    Xem chi tiết
                                                </button>
                                                {order.status === 'pending' && order.paymentStatus !== 'paid' && (
                                                    <button
                                                        onClick={() => openCancelModal(order._id, order.orderNumber || order._id?.slice(-8))}
                                                        className="px-5 py-2.5 border border-red-500 text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        Hủy đơn
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white shadow-sm p-16 text-center">
                                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy đơn hàng</h3>
                                <p className="text-gray-500 mb-6">Bạn chưa có đơn hàng nào hoặc không tìm thấy đơn hàng phù hợp</p>
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                >
                                    Mua sắm ngay
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setSelectedOrder(null);
                        setOrderDetail(null);
                    }}
                >
                    <div
                        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Chi tiết đơn hàng #{orderDetail?.orderNumber || selectedOrder.slice(-8)}
                            </h2>
                            <button
                                onClick={() => {
                                    setSelectedOrder(null);
                                    setOrderDetail(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        {isLoadingDetail ? (
                            <div className="p-6 text-center">
                                <Loader className="mx-auto animate-spin text-[#bd945f]" size={32} />
                                <p className="text-gray-500 mt-2">Đang tải chi tiết...</p>
                            </div>
                        ) : orderDetail ? (
                            <div className="p-6 overflow-y-auto flex-1">
                                {/* Order Timeline */}
                                <div className="flex justify-between items-start mb-8 relative">
                                    <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200"></div>
                                    {[
                                        { status: 'pending', label: 'Đặt hàng', icon: Clock },
                                        { status: 'confirmed', label: 'Đã thanh toán', icon: CheckCircle },
                                        { status: 'shipping', label: 'Vận chuyển', icon: Truck },
                                        { status: 'completed', label: 'Hoàn thành', icon: CheckCircle }
                                    ].map((step, index) => {
                                        const statusOrder = ['pending', 'confirmed', 'shipping', 'completed'];
                                        const currentStatus = orderDetail.status;
                                        const currentIdx = statusOrder.indexOf(currentStatus);
                                        const isActive = currentIdx >= index;
                                        const StepIcon = step.icon;
                                        return (
                                            <div key={step.status} className="flex flex-col items-center relative z-10">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[#bd945f] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                    <StepIcon size={16} />
                                                </div>
                                                <span className={`text-xs mt-2 ${isActive ? 'text-[#bd945f] font-medium' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Shipping Info (nếu đang giao hoặc hoàn thành) */}
                                {(orderDetail.status === 'shipping' || orderDetail.status === 'completed') && orderDetail.shippingCode && (
                                    <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded">
                                        <h4 className="font-medium text-cyan-800 mb-3 pb-2 border-b border-cyan-200 flex items-center gap-2">
                                            <Truck size={16} />
                                            Thông tin vận chuyển
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-0.5">Đơn vị vận chuyển</p>
                                                <p className="font-semibold text-gray-800">{orderDetail.shippingProvider || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-0.5">Mã vận chuyển</p>
                                                <p className="font-semibold text-[#bd945f] text-base tracking-wider">{orderDetail.shippingCode}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Order Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-gray-50">
                                        <h4 className="font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">Thông tin giao hàng</h4>
                                        <p className="text-sm text-gray-600 mb-1"><strong>Người nhận:</strong> {user?.name || 'Chưa cập nhật'}</p>
                                        <p className="text-sm text-gray-600"><strong>SĐT:</strong> {user?.phone || 'Chưa cập nhật'}</p>
                                        <p className="text-sm text-gray-600 mt-1"><strong>Địa chỉ giao hàng:</strong> {orderDetail.shippingAddress || user?.address || 'Chưa cập nhật'}</p>
                                        {orderDetail.notes && (
                                            <p className="text-sm text-gray-600 mt-2"><strong>Ghi chú:</strong> {orderDetail.notes}</p>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50">
                                        <h4 className="font-medium text-gray-800 mb-3 pb-2 border-b border-gray-200">Thông tin thanh toán</h4>
                                        <p className="text-sm text-gray-600 mb-1"><strong>Phương thức:</strong> {orderDetail.paymentMethod === 'zalopay' ? 'ZaloPay' : 'COD'}</p>
                                        <p className="text-sm text-gray-600"><strong>Ngày đặt:</strong> {formatDate(orderDetail.createdAt)}</p>
                                        <p className="text-sm text-gray-600"><strong>Trạng thái TT:</strong> {orderDetail.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-800 mb-3">Sản phẩm đã đặt</h4>
                                    {orderDetail.items?.map((item, index) => (
                                        <div key={item._id || index} className="flex items-center gap-4 py-3 border-b border-gray-100">
                                            <div className="w-12 h-12 overflow-hidden bg-gray-100">
                                                <img
                                                    src={getOrderItemImage(item)}
                                                    alt={item.dish?.name || item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-800">{item.dish?.name || item.name}</h5>
                                                <span className="text-sm text-gray-500">x{item.quantity}</span>
                                            </div>
                                            <div className="font-semibold text-gray-800">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Summary */}
                                <div className="bg-gray-50 p-4">
                                    <div className="flex justify-between py-2 text-gray-600">
                                        <span>Tạm tính</span>
                                        <span>{formatPrice(orderDetail.totalAmount - (orderDetail.deliveryFee || 0) + (orderDetail.discount || 0))}</span>
                                    </div>
                                    {orderDetail.deliveryFee > 0 && (
                                        <div className="flex justify-between py-2 text-gray-600">
                                            <span>Phí vận chuyển</span>
                                            <span>{formatPrice(orderDetail.deliveryFee)}</span>
                                        </div>
                                    )}
                                    {orderDetail.discount > 0 && (
                                        <div className="flex justify-between py-2 text-green-600">
                                            <span>Giảm giá</span>
                                            <span>-{formatPrice(orderDetail.discount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 mt-2 pt-3 flex justify-between items-center">
                                        <strong className="text-gray-800">Tổng cộng</strong>
                                        <strong className="text-xl text-[#bd945f]">{formatPrice(orderDetail.totalAmount)}</strong>
                                    </div>
                                </div>

                                {/* Cancel Button — chỉ hiện khi pending và chưa thanh toán */}
                                {orderDetail.status === 'pending' && orderDetail.paymentStatus !== 'paid' && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => openCancelModal(orderDetail._id, orderDetail.orderNumber || orderDetail._id?.slice(-8))}
                                            className="px-6 py-2.5 border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors font-medium"
                                        >
                                            Hủy đơn hàng
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 text-center">
                                <p className="text-gray-500">Không thể tải chi tiết đơn hàng</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelModal.open && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={closeCancelModal}
                >
                    <div
                        className="bg-white w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 flex items-center justify-center flex-shrink-0">
                                <XCircle size={22} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Hủy đơn hàng</h3>
                                <p className="text-sm text-gray-500">#{cancelModal.orderNum}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.</p>
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hủy <span className="text-gray-400">(không bắt buộc)</span></label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Nhập lý do hủy đơn hàng..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 focus:border-red-400 focus:outline-none resize-none text-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={closeCancelModal}
                                disabled={isCancelling}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCancelling ? <><Loader size={16} className="animate-spin" /> Đang hủy...</> : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
