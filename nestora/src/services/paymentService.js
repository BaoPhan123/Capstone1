import { axiosAuthClient } from '../lib/axios';

const paymentService = {
    // Query trạng thái thanh toán ZaloPay
    queryZaloPayTransaction: async (transactionId) => {
        try {
            const response = await axiosAuthClient.get(`/api/payments/zalopay/query/${transactionId}`);
            return {
                success: true,
                data: response.data.data || response.data,
                // return_code: 1 = success, 2 = fail, 3 = processing
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán',
                error: error.response?.data,
            };
        }
    },

    // Lấy hóa đơn thanh toán
    getInvoice: async (transactionId) => {
        try {
            const response = await axiosAuthClient.get(`/api/payments/invoice/${transactionId}`);
            return {
                success: true,
                data: response.data.data || response.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể tải hóa đơn',
                error: error.response?.data,
            };
        }
    },

    // Helpers để xử lý return_code
    getPaymentStatus: (returnCode) => {
        switch (returnCode) {
            case 1:
                return { status: 'success', message: 'Thanh toán thành công' };
            case 2:
                return { status: 'failed', message: 'Thanh toán thất bại' };
            case 3:
                return { status: 'processing', message: 'Đang xử lý thanh toán' };
            default:
                return { status: 'unknown', message: 'Trạng thái không xác định' };
        }
    },
};

export default paymentService;
