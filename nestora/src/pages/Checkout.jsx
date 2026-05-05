import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, ShoppingBag, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as cartService from '../services/cartService';
import orderService from '../services/orderService';
import { toast } from 'sonner';
import { getImageUrl } from '../lib/utils';

const Checkout = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const buyNowItem = location.state?.buyNowItem || null;
    const isBuyNowFlow = Boolean(buyNowItem?.productId);

    const [cart, setCart] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const hasBootstrappedRef = useRef(false);

    const [paymentMethod, setPaymentMethod] = useState('zalopay');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const bootstrapCheckout = async () => {
            hasBootstrappedRef.current = true;

            const latestUser = await refreshUser();
            const effectiveUser = latestUser || user;

            if (!effectiveUser) {
                navigate('/login');
                return;
            }

            if (isBuyNowFlow) {
                const unitPrice = Number(buyNowItem.price) || 0;
                const quantity = Number(buyNowItem.quantity) || 1;
                const itemSubtotal = unitPrice * quantity;

                setCart({
                    totalAmount: itemSubtotal,
                    totalItems: quantity,
                    items: [{
                        _id: `buy-now-${buyNowItem.productId}`,
                        product: {
                            _id: buyNowItem.productId,
                            images: [buyNowItem.image]
                        },
                        name: buyNowItem.name,
                        price: unitPrice,
                        quantity,
                        subtotal: itemSubtotal,
                        image: buyNowItem.image
                    }]
                });
                setCartItems([{
                    _id: `buy-now-${buyNowItem.productId}`,
                    product: {
                        _id: buyNowItem.productId,
                        images: [buyNowItem.image]
                    },
                    name: buyNowItem.name,
                    price: unitPrice,
                    quantity,
                    subtotal: itemSubtotal,
                    image: buyNowItem.image
                }]);
                setIsLoading(false);
            } else {
                await fetchCart();
            }
        };

        if (!user) {
            navigate('/login');
            return;
        }

        if (hasBootstrappedRef.current) {
            return;
        }

        bootstrapCheckout();
    }, [user, isBuyNowFlow, buyNowItem, navigate]);

    const fetchCart = async () => {
        setIsLoading(true);
        const result = await cartService.getMyCart();
        if (result.success) {
            setCart(result.data);
            setCartItems(result.data.items || []);

            if (result.data.items?.length === 0) {
                toast.error('Giỏ hàng trống');
                navigate('/cart');
            }
        } else {
            toast.error(result.message);
            navigate('/cart');
        }
        setIsLoading(false);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const subtotal = cart?.totalAmount || 0;
    const total = subtotal;

    const handleCheckout = async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        if (!user?.address) {
            toast.error('Vui lòng cập nhật địa chỉ giao hàng trước khi thanh toán');
            navigate('/profile');
            return;
        }

        if (!paymentMethod) {
            toast.error('Vui lòng chọn phương thức thanh toán');
            isProcessingRef.current = false;
            return;
        }

        setIsProcessing(true);

        const baseCheckoutData = {
            paymentMethod,
            notes,
            shippingAddress: user.address
        };

        const checkoutData = isBuyNowFlow
            ? {
                ...baseCheckoutData,
                productId: buyNowItem.productId,
                quantity: buyNowItem.quantity || 1,
            }
            : baseCheckoutData;

        const result = isBuyNowFlow
            ? await orderService.buyNowCheckout(checkoutData)
            : await orderService.checkout(checkoutData);

        if (result.success) {
            const responseData = result.data.data || result.data;

            if (responseData.order_url) {
                toast.success('Đang chuyển đến trang thanh toán...');
                window.location.href = responseData.order_url;
            } else {
                toast.success(result.message || 'Đặt hàng thành công.');
                navigate('/orders');
            }
        } else {
            toast.error(result.message || 'Đặt hàng thất bại');
            isProcessingRef.current = false;
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8f8f8] py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center py-20">
                        <Loader className="mx-auto animate-spin text-[#bd945f]" size={48} />
                        <p className="text-gray-500 mt-4">Đang tải...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8f8] py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Thanh toán</h1>
                    <Link to={isBuyNowFlow ? '/products' : '/cart'} className="inline-flex items-center gap-2 text-gray-600 hover:text-[#bd945f] transition-colors">
                        <ArrowLeft size={18} />
                        {isBuyNowFlow ? 'Quay lại sản phẩm' : 'Quay lại giỏ hàng'}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                    {/* Left Column - Payment Info */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin khách hàng</h2>
                            <div className="space-y-3 text-gray-600">
                                <div className="flex gap-3">
                                    <span className="font-medium w-32">Họ tên:</span>
                                    <span>{user?.name || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="font-medium w-32">Email:</span>
                                    <span>{user?.email}</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="font-medium w-32">Số điện thoại:</span>
                                    <span>{user?.phone || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="font-medium w-32">Địa chỉ giao hàng:</span>
                                    {user?.address ? (
                                        <span>{user.address}</span>
                                    ) : (
                                        <span className="text-red-500 font-medium">Chưa cập nhật (Bắt buộc)</span>
                                    )}
                                </div>
                            </div>
                            <Link
                                to="/profile"
                                className="inline-block mt-4 text-sm text-[#bd945f] hover:underline"
                            >
                                Cập nhật thông tin →
                            </Link>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Phương thức thanh toán</h2>
                            <div className="space-y-3">
                                {/* ZaloPay */}
                                <label className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${paymentMethod === 'zalopay'
                                    ? 'border-[#bd945f] bg-[#bd945f]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="zalopay"
                                        checked={paymentMethod === 'zalopay'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-4 h-4"
                                    />
                                    <Wallet size={24} className="text-blue-500" />
                                    <div className="flex-1">
                                        <div className="font-medium">ZaloPay</div>
                                        <div className="text-sm text-gray-500">Thanh toán qua ví điện tử ZaloPay</div>
                                    </div>
                                </label>


                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ghi chú đơn hàng</h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi chú về đơn hàng (không bắt buộc)"
                                className="w-full px-4 py-3 border border-gray-200 focus:border-[#bd945f] focus:outline-none transition-colors resize-none"
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div>
                        <div className="bg-white p-6 shadow-sm sticky top-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Đơn hàng của bạn</h2>

                            {/* Products */}
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {cartItems.map(item => (
                                    <div key={item._id} className="flex gap-3">
                                        <div className="w-16 h-16 bg-gray-50 overflow-hidden flex-shrink-0">
                                            <img
                                                src={getImageUrl(item.product?.images?.[0] || item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-800 truncate">{item.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {formatPrice(item.price)} x {item.quantity}
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-gray-800">
                                            {formatPrice(item.subtotal)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>

                                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-lg">
                                    <span className="font-semibold">Tổng cộng</span>
                                    <strong className="text-[#bd945f] text-xl">{formatPrice(total)}</strong>
                                </div>
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || cartItems.length === 0}
                                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-[#bd945f] text-white hover:bg-[#a67d4a] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag size={18} />
                                        Đặt hàng
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Bằng việc đặt hàng, bạn đồng ý với{' '}
                                <Link to="/terms" className="text-[#bd945f] hover:underline">Điều khoản dịch vụ</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
