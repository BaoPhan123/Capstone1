import { axiosAuthClient, axiosInstance } from '../lib/axios';

const reviewService = {
    // Lấy danh sách reviews của sản phẩm (không cần auth)
    getProductReviews: async (productId, params = {}) => {
        try {
            const response = await axiosInstance.get(`/api/reviews/prod-review/${productId}`, { params });

            // Handle different response structures
            const reviewsData = response.data.data?.data || response.data.data || [];

            return {
                success: true,
                data: response.data.data || { total: 0, data: [] },
                reviews: Array.isArray(reviewsData) ? reviewsData : [],
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy đánh giá',
                error: error.response?.data,
            };
        }
    },

    // Kiểm tra quyền đánh giá (cần auth)
    getReviewStatus: async (productId) => {
        try {
            const response = await axiosAuthClient.get(`/api/reviews/prod-review/${productId}/status`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể kiểm tra trạng thái đánh giá',
            };
        }
    },

    // Thêm review cho sản phẩm (cần auth)
    addReview: async (productId, reviewData) => {
        try {
            const response = await axiosAuthClient.post(`/api/reviews/prod-review/${productId}/add`, reviewData);
            return {
                success: true,
                data: response.data.data?.data || response.data.data,
                message: response.data.data?.message || 'Đánh giá thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đánh giá thất bại',
                error: error.response?.data,
            };
        }
    },

    // Update review
    updateReview: async (productId, reviewData) => {
        try {
            const response = await axiosAuthClient.patch(`/api/reviews/prod-review/${productId}/update`, reviewData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Cập nhật đánh giá thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật đánh giá thất bại',
                error: error.response?.data,
            };
        }
    },

    // Delete review
    deleteReview: async (productId) => {
        try {
            const response = await axiosAuthClient.delete(`/api/reviews/prod-review/${productId}`);
            return {
                success: true,
                message: response.data.message || 'Xóa đánh giá thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Xóa đánh giá thất bại',
                error: error.response?.data,
            };
        }
    },
};

export default reviewService;
