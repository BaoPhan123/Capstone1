import { axiosAuthClient } from '../lib/axios';

const orderService = {
    // Checkout - Tạo đơn hàng từ giỏ hàng
    checkout: async (checkoutData) => {
        try {
            const response = await axiosAuthClient.post('/api/cart/checkout', checkoutData);
            return {
                success: true,
                data: response.data, // { order, payment, order_url }
                message: 'Đặt hàng thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đặt hàng thất bại',
                error: error.response?.data,
            };
        }
    },

    buyNowCheckout: async (checkoutData) => {
        try {
            const response = await axiosAuthClient.post('/api/cart/buy-now-checkout', checkoutData);
            return {
                success: true,
                data: response.data,
                message: 'Đặt hàng thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đặt hàng mua ngay thất bại',
                error: error.response?.data,
            };
        }
    },

    // Lấy danh sách đơn hàng của user
    getMyOrders: async (params = {}) => {
        try {
            const response = await axiosAuthClient.get('/api/orders/my-orders', { params });
            return {
                success: true,
                data: response.data.data,
                pagination: response.data.pagination,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy danh sách đơn hàng',
                error: error.response?.data,
            };
        }
    },

    // Lấy chi tiết đơn hàng
    getOrderDetail: async (orderId) => {
        try {
            const response = await axiosAuthClient.get(`/api/orders/detail/${orderId}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy chi tiết đơn hàng',
                error: error.response?.data,
            };
        }
    },

    // Hủy đơn hàng
    cancelOrder: async (orderId, cancelReason = '') => {
        try {
            const response = await axiosAuthClient.delete(`/api/orders/cancel/${orderId}`, {
                data: { cancelReason }
            });
            return {
                success: true,
                message: response.data.message || 'Hủy đơn hàng thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Hủy đơn hàng thất bại',
                error: error.response?.data,
            };
        }
    },
};

export default orderService;
