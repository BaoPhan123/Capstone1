import { axiosAuthClient } from '../lib/axios';

const adminOrderService = {
    getOrders: async (params = {}) => {
        try {
            const response = await axiosAuthClient.get('/api/admin/orders', { params });
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

    updateOrderStatus: async (orderId, status, shippingCode = '', shippingProvider = '') => {
        try {
            const body = { status };
            if (shippingCode) body.shippingCode = shippingCode;
            if (shippingProvider) body.shippingProvider = shippingProvider;

            const response = await axiosAuthClient.patch(`/api/admin/orders/${orderId}/status`, body);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Cập nhật trạng thái đơn hàng thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật trạng thái đơn hàng thất bại',
                error: error.response?.data,
            };
        }
    },

    getOrderStatistics: async (params = {}) => {
        try {
            const response = await axiosAuthClient.get('/api/admin/reports/orders', { params });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy thống kê đơn hàng',
                error: error.response?.data,
            };
        }
    },
};

export default adminOrderService;
