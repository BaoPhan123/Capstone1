import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Package, ArrowLeft } from 'lucide-react';
import paymentService from '../services/paymentService';
import { toast } from 'sonner';

const OrderStatus = () => {
    const { transactionId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('checking'); // checking, success, failed, processing
    const [orderData, setOrderData] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 10; // 10 lần check

    useEffect(() => {
        if (!transactionId) {
            navigate('/');
            return;
        }

        checkPaymentStatus();
    }, [transactionId]);

    const checkPaymentStatus = async () => {
        const result = await paymentService.queryZaloPayTransaction(transactionId);

        if (result.success) {
            const data = result.data;
            const returnCode = data.return_code;
            const isProcessing = data.is_processing;

            if (returnCode === 1) {
                // Success
                setStatus('success');
                setOrderData(data);
            } else if (returnCode === 2) {
                // Failed
                setStatus('failed');
                setOrderData(data);
                toast.error('Thanh toán thất bại!');
            } else if (returnCode === 3 || isProcessing) {
                // Processing
                setStatus('processing');
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        checkPaymentStatus();
                    }, 2000);
                } else {
                    setStatus('error');
                    toast.error('Không thể xác nhận thanh toán. Vui lòng kiểm tra lại đơn hàng.');
                }
            } else {
                setStatus('error');
            }
        } else {
            setStatus('error');
            toast.error(result.message || 'Không thể kiểm tra trạng thái thanh toán');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    return (
        <div className="min-h-screen bg-[#f8f8f8] py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Status Card */}
                    <div className="bg-white shadow-sm p-8 text-center">
                        {status === 'checking' && (
                            <>
                                <Loader className="mx-auto text-[#bd945f] mb-4 animate-spin" size={64} />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang kiểm tra thanh toán</h2>
                                <p className="text-gray-500">Vui lòng chờ trong giây lát...</p>
                            </>
                        )}

                        {status === 'processing' && (
                            <>
                                <Loader className="mx-auto text-blue-500 mb-4 animate-spin" size={64} />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xử lý thanh toán</h2>
                                <p className="text-gray-500">Giao dịch đang được xử lý. Vui lòng chờ...</p>
                                <p className="text-sm text-gray-400 mt-2">Đã kiểm tra: {retryCount}/{maxRetries}</p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h2>
                                <p className="text-gray-500 mb-6">Đơn hàng của bạn đã được xác nhận</p>
                                
                                {orderData && (
                                    <div className="bg-gray-50 p-6 mb-6 text-left">
                                        <h3 className="font-semibold text-gray-800 mb-3">Thông tin đơn hàng</h3>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex justify-between">
                                                <span>Mã giao dịch:</span>
                                                <span className="font-medium">{transactionId}</span>
                                            </div>
                                            {orderData.order_id && (
                                                <div className="flex justify-between">
                                                    <span>Mã đơn hàng:</span>
                                                    <span className="font-medium">#{orderData.order_id}</span>
                                                </div>
                                            )}
                                            {orderData.amount && (
                                                <div className="flex justify-between">
                                                    <span>Số tiền:</span>
                                                    <span className="font-medium text-[#bd945f]">{formatPrice(orderData.amount)}</span>
                                                </div>
                                            )}
                                            {orderData.server_time && (
                                                <div className="flex justify-between">
                                                    <span>Thời gian:</span>
                                                    <span className="font-medium text-[#bd945f]">
                                                        {new Date(orderData.server_time).toLocaleString('vi-VN', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-center">
                                    <Link
                                        to="/orders"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                    >
                                        <Package size={18} />
                                        Xem đơn hàng
                                    </Link>
                                    <Link
                                        to="/products"
                                        className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Tiếp tục mua sắm
                                    </Link>
                                </div>
                            </>
                        )}

                        {status === 'failed' && (
                            <>
                                <XCircle className="mx-auto text-red-500 mb-4" size={64} />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h2>
                                <p className="text-gray-500 mb-6">Giao dịch không thành công. Vui lòng thử lại.</p>
                                
                                <div className="flex gap-4 justify-center">
                                    <Link
                                        to="/cart"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                        Quay lại giỏ hàng
                                    </Link>
                                    <Link
                                        to="/products"
                                        className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Tiếp tục mua sắm
                                    </Link>
                                </div>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <XCircle className="mx-auto text-red-500 mb-4" size={64} />
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
                                <p className="text-gray-500 mb-6">Không thể kiểm tra trạng thái thanh toán. Vui lòng kiểm tra lại đơn hàng hoặc liên hệ hỗ trợ.</p>
                                
                                <div className="flex gap-4 justify-center flex-wrap">
                                    <Link
                                        to="/orders"
                                        className="px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors"
                                    >
                                        Xem đơn hàng
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setStatus('checking');
                                            setRetryCount(0);
                                            checkPaymentStatus();
                                        }}
                                        className="px-6 py-3 border border-[#bd945f] text-[#bd945f] hover:bg-[#bd945f] hover:text-white transition-colors"
                                    >
                                        Thử lại
                                    </button>
                                    <Link
                                        to="/"
                                        className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Về trang chủ
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Nếu có vấn đề, vui lòng liên hệ:</p>
                        <p className="mt-1">
                            <a href="tel:1900xxxx" className="text-[#bd945f] hover:underline">Hotline: 1900 xxxx</a>
                            {' hoặc '}
                            <a href="mailto:support@nestora.vn" className="text-[#bd945f] hover:underline">support@nestora.vn</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatus;
