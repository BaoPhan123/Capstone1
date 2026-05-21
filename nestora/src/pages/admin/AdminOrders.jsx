import { useEffect, useState } from 'react';
import {
    Search,
    Eye,
    Edit,
    ChevronLeft,
    ChevronRight,
    X,
    Package,
    CheckCircle,
    XCircle,
    Clock,
    MapPin,
    Phone,
    Mail,
    User,
    Loader,
    Truck,
    Hash,
    Building2,
    Download
} from 'lucide-react';
import { getImageUrl } from '../../lib/utils';
import adminOrderService from '../../services/adminOrderService';
import { exportRowsToExcel } from '../../utils/exportExcel';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao hàng' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_LABELS = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao hàng',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy',
};

const STATUS_CLASSES = {
    pending: 'status-pending',
    confirmed: 'status-processing',
    shipping: 'status-shipping',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
};

const STATUS_ICONS = {
    pending: Clock,
    confirmed: CheckCircle,
    shipping: Truck,
    completed: CheckCircle,
    cancelled: XCircle,
};

// Transition rules: which statuses admin can move TO from the current status
const ALLOWED_TRANSITIONS = {
    pending: [],           // pending chờ thanh toán – admin không đổi
    confirmed: ['shipping'], // đã thanh toán → đang giao
    shipping: ['completed'], // đang giao → hoàn thành
    completed: [],
    cancelled: [],
};

const PAYMENT_METHOD_LABELS = {
    zalopay: 'ZaloPay',
    banking: 'Chuyển khoản',
};

const PAYMENT_STATUS_LABELS = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
};

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
}).format(Number(value || 0));

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date);
};

const formatDateOnly = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short'
    }).format(date);
};

const getOrderDisplayId = (order) => {
    if (!order?._id) return '-';
    return `#${String(order._id).slice(-6).toUpperCase()}`;
};

const getDateRangeParams = (dateValue) => {
    if (!dateValue) return {};

    const startDate = new Date(`${dateValue}T00:00:00`);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setMilliseconds(endDate.getMilliseconds() - 1);

    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    };
};

const normalizeOrder = (order) => {
    const customer = order.user || {};
    const items = Array.isArray(order.items) ? order.items : [];

    return {
        ...order,
        customerName: customer.name || 'Khách hàng',
        customerEmail: customer.email || '-',
        customerPhone: customer.phone || '-',
        itemsCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        paymentMethodLabel: PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '-',
        paymentStatusLabel: PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '-',
        statusLabel: STATUS_LABELS[order.status] || order.status || '-',
    };
};

// ─── Timeline component ───────────────────────────────────────────────────────
const OrderTimeline = ({ order }) => {
    const steps = [
        { key: 'pending',   label: 'Đặt hàng',       date: order.createdAt },
        { key: 'confirmed', label: 'Đã thanh toán',   date: order.confirmedAt },
        { key: 'shipping',  label: 'Đang giao hàng',  date: order.shippingAt },
        { key: 'completed', label: 'Đã hoàn thành',   date: order.completedAt },
    ];

    const statusOrder = ['pending', 'confirmed', 'shipping', 'completed'];
    const currentIdx = order.status === 'cancelled'
        ? -1
        : statusOrder.indexOf(order.status);

    return (
        <div className="order-timeline-horizontal">
            {steps.map((step, index) => {
                const isCompleted = currentIdx >= index;
                const isCurrent  = currentIdx === index;
                return (
                    <div key={step.key} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="timeline-step-dot">
                            {isCompleted ? <CheckCircle size={16} /> : <div className="timeline-dot-inner" />}
                        </div>
                        <div className="timeline-step-content">
                            <span className="timeline-step-label">{step.label}</span>
                            <span className="timeline-step-date">{formatDateTime(step.date)}</span>
                            {step.key === 'shipping' && order.shippingCode && (
                                <div className="timeline-shipping-info">
                                    <span className="shipping-provider">{order.shippingProvider}</span>
                                    <span className="shipping-code">
                                        <Hash size={12} /> {order.shippingCode}
                                    </span>
                                </div>
                            )}
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`timeline-connector ${currentIdx > index ? 'done' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────
const OrderDetailModal = ({ isOpen, onClose, order, onSaveStatus, isSavingStatus }) => {
    const [nextStatus, setNextStatus] = useState('');
    const [shippingCode, setShippingCode] = useState('');
    const [shippingProvider, setShippingProvider] = useState('');

    useEffect(() => {
        const allowed = ALLOWED_TRANSITIONS[order?.status] || [];
        setNextStatus(allowed[0] || '');
        setShippingCode('');
        setShippingProvider('');
    }, [order]);

    if (!isOpen || !order) return null;

    const customer = order.user || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
    const canUpdate = allowedNext.length > 0;

    const handleSave = async () => {
        if (!nextStatus) return;
        await onSaveStatus(order, nextStatus, shippingCode, shippingProvider);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container order-detail-modal">
                <div className="modal-header">
                    <h2>Chi tiết đơn hàng {getOrderDisplayId(order)}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Timeline */}
                    <div className="detail-section full-width">
                        <h3 className="section-title">
                            <Truck size={18} />
                            Tiến trình đơn hàng
                        </h3>
                        <OrderTimeline order={order} />
                        {order.status === 'cancelled' && (
                            <div className="cancelled-notice">
                                <XCircle size={16} />
                                <span>Đơn hàng đã bị hủy{order.cancelledAt ? ` lúc ${formatDateTime(order.cancelledAt)}` : ''}</span>
                                {order.cancelReason && <span className="cancel-reason"> — {order.cancelReason}</span>}
                            </div>
                        )}
                    </div>

                    {/* Mã vận chuyển (nếu đã có) */}
                    {order.shippingCode && (
                        <div className="detail-section full-width shipping-info-banner">
                            <h3 className="section-title">
                                <Package size={18} />
                                Thông tin vận chuyển
                            </h3>
                            <div className="shipping-banner-grid">
                                <div className="shipping-banner-item">
                                    <Building2 size={16} />
                                    <div>
                                        <span className="shipping-banner-label">Đơn vị vận chuyển</span>
                                        <strong className="shipping-banner-value">{order.shippingProvider}</strong>
                                    </div>
                                </div>
                                <div className="shipping-banner-item">
                                    <Hash size={16} />
                                    <div>
                                        <span className="shipping-banner-label">Mã vận chuyển</span>
                                        <strong className="shipping-banner-value shipping-code-highlight">{order.shippingCode}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="order-detail-grid">
                        <div className="detail-section">
                            <h3 className="section-title">
                                <User size={18} />
                                Thông tin khách hàng
                            </h3>
                            <div className="detail-content">
                                <div className="detail-row">
                                    <span className="label">Họ tên:</span>
                                    <span className="value">{customer.name || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label"><Mail size={14} /></span>
                                    <span className="value">{customer.email || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label"><Phone size={14} /></span>
                                    <span className="value">{customer.phone || '-'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label"><MapPin size={14} /></span>
                                    <span className="value">{order.shippingAddress || customer.address || 'Chưa cung cấp'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3 className="section-title">
                                <Package size={18} />
                                Tổng quan đơn hàng
                            </h3>
                            <div className="detail-content">
                                <div className="detail-row">
                                    <span className="label">Tổng tiền:</span>
                                    <strong className="value">{formatCurrency(order.totalAmount)}</strong>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Thanh toán:</span>
                                    <span className="value">{order.paymentMethodLabel}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Trạng thái TT:</span>
                                    <span className="value">{order.paymentStatusLabel}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Phí vận chuyển:</span>
                                    <span className="value">{formatCurrency(order.deliveryFee)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Giảm giá:</span>
                                    <span className="value">{formatCurrency(order.discount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section full-width">
                        <h3 className="section-title">
                            <Package size={18} />
                            Sản phẩm đặt hàng
                        </h3>
                        <table className="order-items-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th>Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => {
                                    const product = item.product || {};
                                    const thumbnail = getImageUrl(product.thumbnail || product.image || '');

                                    return (
                                        <tr key={`${item.name}-${index}`}>
                                            <td>
                                                <div className="order-item-cell">
                                                    <div className="order-item-thumb">
                                                        <img src={thumbnail} alt={item.name} />
                                                    </div>
                                                    <div className="order-item-info">
                                                        <strong>{item.name}</strong>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.price)}</td>
                                            <td>{formatCurrency(item.subtotal || Number(item.price || 0) * Number(item.quantity || 0))}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3}>Tạm tính</td>
                                    <td>{formatCurrency(order.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3}>Phí vận chuyển</td>
                                    <td>{formatCurrency(order.deliveryFee)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3}>Giảm giá</td>
                                    <td>{formatCurrency(order.discount)}</td>
                                </tr>
                                <tr className="total-row">
                                    <td colSpan={3}>Tổng cộng</td>
                                    <td>{formatCurrency(order.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer: cập nhật trạng thái — Tái kế HTML sang Tailwind CSS */}
                {canUpdate && (
                    <div className="mt-4 p-5 md:p-6 bg-gradient-to-br from-gray-50 to-white border-t border-gray-100 rounded-b-lg flex flex-col gap-5">
                        <div className="flex-1">
                            <h4 className="flex items-center gap-2 text-base font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
                                <Edit size={18} className="text-[#bd945f]" />
                                Cập nhật trạng thái đơn hàng
                            </h4>

                            {/* Form Nhập mã vận chuyển */}
                            {nextStatus === 'shipping' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="shipping-provider" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                            <Building2 size={16} className="text-gray-400" />
                                            Đơn vị vận chuyển <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="shipping-provider"
                                            type="text"
                                            placeholder="VD: GHTK, GHN, ViettelPost..."
                                            value={shippingProvider}
                                            onChange={(e) => setShippingProvider(e.target.value)}
                                            className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200 bg-white"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="shipping-code" className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                            <Hash size={16} className="text-gray-400" />
                                            Mã vận chuyển <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="shipping-code"
                                            type="text"
                                            placeholder="Nhập mã tracking..."
                                            value={shippingCode}
                                            onChange={(e) => setShippingCode(e.target.value)}
                                            className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all duration-200 bg-white placeholder-gray-400 font-mono"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Thông báo Hoàn thành */}
                            {nextStatus === 'completed' && (
                                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle size={18} className="text-green-600" />
                                    </div>
                                    Xác nhận đơn hàng đã được giao thành công đến khách hàng.
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100/50">
                            <button 
                                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all duration-200 flex items-center gap-2"
                                onClick={onClose}
                            >
                                Đóng
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={
                                    isSavingStatus ||
                                    (nextStatus === 'shipping' && (!shippingCode.trim() || !shippingProvider.trim()))
                                }
                                className={`
                                    px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${nextStatus === 'shipping' 
                                        ? 'bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-600/20 shadow-cyan-600/20' 
                                        : nextStatus === 'completed'
                                            ? 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-600/20 shadow-green-600/20'
                                            : 'bg-[#bd945f] hover:bg-[#a67d4a] focus:ring-4 focus:ring-[#bd945f]/20 shadow-[#bd945f]/20'
                                    }
                                `}
                            >
                                {isSavingStatus ? (
                                    <>
                                        <Loader className="animate-spin" size={16} />
                                        Đang lưu...
                                    </>
                                ) : nextStatus === 'shipping' ? (
                                    <>
                                        <Truck size={16} />
                                        Cập nhật giao hàng
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Xác nhận hoàn thành
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer UI - View Only mode */}
                {!canUpdate && (
                    <div className="flex items-center justify-end p-5 pt-0 mt-4 border-t-0">
                        <button 
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all duration-200" 
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminOrders = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isSavingStatus, setIsSavingStatus] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadOrders();
        }, 250);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, dateFilter, currentPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadStatistics();
        }, 250);

        return () => clearTimeout(timer);
    }, [dateFilter]);

    const loadOrders = async () => {
        setIsLoading(true);
        setError('');

        const params = {
            page: currentPage,
            limit: 10,
        };

        if (searchTerm.trim()) {
            params.q = searchTerm.trim();
        }

        if (statusFilter) {
            params.status = statusFilter;
        }

        Object.assign(params, getDateRangeParams(dateFilter));

        const result = await adminOrderService.getOrders(params);

        if (result.success) {
            const normalizedOrders = (result.data || []).map(normalizeOrder);
            setOrders(normalizedOrders);
            setPagination(result.pagination || { page: currentPage, limit: 10, total: 0, pages: 0 });

            if (currentPage > 1 && (result.pagination?.pages || 0) > 0 && currentPage > result.pagination.pages) {
                setCurrentPage(result.pagination.pages);
            }
        } else {
            setError(result.message || 'Không thể tải danh sách đơn hàng');
            setOrders([]);
            setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
        }

        setIsLoading(false);
    };

    const loadStatistics = async () => {
        setIsStatsLoading(true);

        const params = {};
        Object.assign(params, getDateRangeParams(dateFilter));

        const result = await adminOrderService.getOrderStatistics(params);

        if (result.success) {
            const statusDistribution = result.data?.statusDistribution || [];
            const counts = statusDistribution.reduce((accumulator, item) => {
                accumulator[item._id || 'unknown'] = item.count || 0;
                return accumulator;
            }, {});

            const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

            setStats({
                total,
                pending: counts.pending || 0,
                confirmed: counts.confirmed || 0,
                shipping: counts.shipping || 0,
                completed: counts.completed || 0,
                cancelled: counts.cancelled || 0,
            });
        }

        setIsStatsLoading(false);
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const handleSaveStatus = async (order, nextStatus, shippingCode, shippingProvider) => {
        if (!order || !nextStatus) return;

        setIsSavingStatus(true);
        const result = await adminOrderService.updateOrderStatus(order._id, nextStatus, shippingCode, shippingProvider);
        setIsSavingStatus(false);

        if (result.success) {
            toast.success(result.message || 'Cập nhật trạng thái đơn hàng thành công');
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
            await loadOrders();
            await loadStatistics();
        } else {
            toast.error(result.message || 'Cập nhật trạng thái đơn hàng thất bại');
        }
    };

    const buildOrderParams = (overrides = {}) => {
        const params = { ...overrides };

        if (searchTerm.trim()) {
            params.q = searchTerm.trim();
        }

        if (statusFilter) {
            params.status = statusFilter;
        }

        Object.assign(params, getDateRangeParams(dateFilter));
        return params;
    };

    const handleExportOrders = async () => {
        setIsExporting(true);

        const exportLimit = Math.max(Number(pagination.total || 0), orders.length, 1000);
        const result = await adminOrderService.getOrders(buildOrderParams({
            page: 1,
            limit: exportLimit,
        }));

        setIsExporting(false);

        if (!result.success) {
            toast.error(result.message || 'Không thể xuất Excel danh sách đơn hàng');
            return;
        }

        const rows = (result.data || []).map(normalizeOrder).map((order, index) => ({
            ...order,
            orderNumber: index + 1,
            displayId: getOrderDisplayId(order),
            orderedItems: (order.items || [])
                .map((item) => `${item.name} x${item.quantity}`)
                .join(', '),
        }));

        if (rows.length === 0) {
            toast.error('Không có đơn hàng để xuất Excel');
            return;
        }

        exportRowsToExcel({
            filename: `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.xls`,
            sheetName: 'Don hang',
            columns: [
                { header: 'STT', value: (row) => row.orderNumber },
                { header: 'Mã đơn', value: (row) => row.displayId },
                { header: 'Khách hàng', value: (row) => row.customerName },
                { header: 'Email', value: (row) => row.customerEmail },
                { header: 'Số điện thoại', value: (row) => row.customerPhone },
                { header: 'Địa chỉ giao hàng', value: (row) => row.shippingAddress || '-' },
                { header: 'Sản phẩm', value: (row) => row.orderedItems || '-' },
                { header: 'Số SP', value: (row) => row.itemsCount },
                { header: 'Tạm tính', value: (row) => Number(row.subtotal || 0) },
                { header: 'Phí vận chuyển', value: (row) => Number(row.deliveryFee || 0) },
                { header: 'Giảm giá', value: (row) => Number(row.discount || 0) },
                { header: 'Tổng tiền', value: (row) => Number(row.totalAmount || 0) },
                { header: 'Phương thức thanh toán', value: (row) => row.paymentMethodLabel },
                { header: 'Trạng thái thanh toán', value: (row) => row.paymentStatusLabel },
                { header: 'Trạng thái đơn', value: (row) => row.statusLabel },
                { header: 'Đơn vị vận chuyển', value: (row) => row.shippingProvider || '-' },
                { header: 'Mã vận chuyển', value: (row) => row.shippingCode || '-' },
                { header: 'Ngày đặt', value: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '-' },
                { header: 'Ghi chú', value: (row) => row.notes || '-' },
            ],
            rows,
        });

        toast.success('Xuất Excel danh sách đơn hàng thành công');
    };

    const getStatusIcon = (status) => STATUS_ICONS[status] || Clock;

    const paginationButtons = [];
    for (let index = 1; index <= (pagination.pages || 0); index += 1) {
        paginationButtons.push(index);
    }

    const FILTER_OPTIONS = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'shipping', label: 'Đang giao hàng' },
        { value: 'completed', label: 'Đã hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
    ];

    return (
        <div className="admin-orders">
            <div className="page-header">
                <div className="page-header-content">
                    <h1 className="page-title">Quản lý đơn hàng</h1>
                    <p className="page-subtitle">Dữ liệu đơn hàng được lấy trực tiếp từ cơ sở dữ liệu</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn-secondary" onClick={handleExportOrders} disabled={isLoading || isExporting}>
                        {isExporting ? <Loader className="spinner" size={18} /> : <Download size={18} />}
                        {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                    </button>
                </div>
            </div>

            <div className="order-stats-grid">
                {[
                    { label: 'Tổng đơn hàng', value: isStatsLoading ? '...' : stats.total, icon: Package, color: 'blue' },
                    { label: 'Chờ xử lý', value: isStatsLoading ? '...' : stats.pending, icon: Clock, color: 'yellow' },
                    { label: 'Đã xác nhận', value: isStatsLoading ? '...' : stats.confirmed, icon: CheckCircle, color: 'green' },
                    { label: 'Đang giao', value: isStatsLoading ? '...' : stats.shipping, icon: Truck, color: 'cyan' },
                    { label: 'Hoàn thành', value: isStatsLoading ? '...' : stats.completed, icon: CheckCircle, color: 'teal' },
                    { label: 'Đã hủy', value: isStatsLoading ? '...' : stats.cancelled, icon: XCircle, color: 'red' },
                ].map((stat, index) => (
                    <div key={index} className={`order-stat-card ${stat.color}`}>
                        <div className="stat-icon-wrapper">
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <h3 className="stat-value">{stat.value}</h3>
                            <p className="stat-label">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="filters-card">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, email hoặc số điện thoại khách hàng..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-select"
                    >
                        {FILTER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                            setDateFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-date"
                    />
                </div>
            </div>

            <div className="table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" className="checkbox" />
                                </th>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Số SP</th>
                                <th>Tổng tiền</th>
                                <th>Thanh toán</th>
                                <th>Trạng thái</th>
                                <th>Mã vận chuyển</th>
                                <th>Ngày đặt</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && !error && orders.length === 0 && (
                                <tr>
                                    <td colSpan={10}>
                                        <div className="empty-state" style={{ marginTop: 0, border: 0 }}>
                                            <Package size={64} />
                                            <h3>Không tìm thấy đơn hàng</h3>
                                            <p>Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {orders.map((order) => {
                                const StatusIcon = getStatusIcon(order.status);

                                return (
                                    <tr key={order._id}>
                                        <td>
                                            <input type="checkbox" className="checkbox" />
                                        </td>
                                        <td className="order-id-cell">
                                            <span className="order-id">{getOrderDisplayId(order)}</span>
                                        </td>
                                        <td>
                                            <div className="customer-cell">
                                                <div className="customer-avatar">
                                                    {String(order.customerName || 'K').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="customer-info">
                                                    <span className="customer-name">{order.customerName}</span>
                                                    <span className="customer-email">{order.customerEmail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="items-cell">{order.itemsCount}</td>
                                        <td className="amount-cell">{formatCurrency(order.totalAmount)}</td>
                                        <td className="payment-cell">{order.paymentMethodLabel}</td>
                                        <td>
                                            <span className={`status-badge ${STATUS_CLASSES[order.status] || ''}`}>
                                                <StatusIcon size={14} />
                                                {order.statusLabel}
                                            </span>
                                        </td>
                                        <td className="tracking-cell">
                                            {order.shippingCode ? (
                                                <div className="tracking-info">
                                                    <span className="tracking-provider">{order.shippingProvider}</span>
                                                    <span className="tracking-code">{order.shippingCode}</span>
                                                </div>
                                            ) : (
                                                <span className="tracking-empty">—</span>
                                            )}
                                        </td>
                                        <td className="date-cell">{formatDateOnly(order.createdAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view"
                                                    title="Xem chi tiết"
                                                    onClick={() => handleViewOrder(order)}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {ALLOWED_TRANSITIONS[order.status]?.length > 0 && (
                                                    <button
                                                        className="action-btn edit"
                                                        title="Cập nhật trạng thái"
                                                        onClick={() => handleViewOrder(order)}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {isLoading && (
                    <div className="text-center py-20">
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ marginTop: '1rem' }}>Đang tải đơn hàng...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="empty-state" style={{ borderTop: '1px solid #e5e5e5' }}>
                        <XCircle size={64} />
                        <h3>Không thể tải dữ liệu</h3>
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && pagination.pages > 1 && (
                    <div className="table-pagination">
                        <div className="pagination-info">
                            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} đơn hàng
                        </div>
                        <div className="pagination-buttons">
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === 1}
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {paginationButtons.map((page) => (
                                <button
                                    key={page}
                                    className={`pagination-btn ${pagination.page === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.pages))}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <OrderDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
                onSaveStatus={handleSaveStatus}
                isSavingStatus={isSavingStatus}
            />
        </div>
    );
};

export default AdminOrders;
