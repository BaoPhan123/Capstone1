import { axiosAuthClient } from '../lib/axios';

const userService = {
    // Lấy thông tin profile người dùng
    getProfile: async () => {
        try {
            const response = await axiosAuthClient.get('/api/users/profile');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy thông tin profile',
            };
        }
    },

    // Cập nhật thông tin profile
    updateProfile: async (profileData) => {
        try {
            const response = await axiosAuthClient.patch('/api/users/profile', profileData);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật thông tin thất bại',
                errors: error.response?.data?.errors || [],
            };
        }
    },

    // Đổi mật khẩu
    changePassword: async (passwordData) => {
        try {
            const response = await axiosAuthClient.post('/api/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            return {
                success: true,
                message: response.data.message || 'Đổi mật khẩu thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đổi mật khẩu thất bại',
                errors: error.response?.data?.errors || [],
            };
        }
    },

    // Lấy thống kê tài khoản
    getAccountStats: async () => {
        try {
            const response = await axiosAuthClient.get('/api/users/stats');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy thống kê tài khoản',
            };
        }
    },

    // Thêm địa chỉ giao hàng
    addAddress: async (addressData) => {
        try {
            const response = await axiosAuthClient.post('/api/users/addresses', addressData);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Thêm địa chỉ thất bại',
            };
        }
    },

    // Cập nhật địa chỉ giao hàng
    updateAddress: async (addressId, addressData) => {
        try {
            const response = await axiosAuthClient.put(`/api/users/addresses/${addressId}`, addressData);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật địa chỉ thất bại',
            };
        }
    },

    // Xóa địa chỉ giao hàng
    deleteAddress: async (addressId) => {
        try {
            const response = await axiosAuthClient.delete(`/api/users/addresses/${addressId}`);
            return {
                success: true,
                message: response.data.message || 'Xóa địa chỉ thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Xóa địa chỉ thất bại',
            };
        }
    },

    // Đặt địa chỉ mặc định
    setDefaultAddress: async (addressId) => {
        try {
            const response = await axiosAuthClient.patch(`/api/users/addresses/${addressId}/default`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật địa chỉ mặc định thất bại',
            };
        }
    },

    // Lấy danh sách món ăn yêu thích
    getPreferences: async () => {
        try {
            const response = await axiosAuthClient.get('/api/users/preferences');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy thông tin yêu thích',
            };
        }
    },

    // Thêm sản phẩm yêu thích
    addFavoriteDish: async (productId) => {
        try {
            const response = await axiosAuthClient.post('/api/users/favorites', { dishId: productId });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Thêm yêu thích thất bại',
            };
        }
    },

    // Xóa sản phẩm yêu thích
    removeFavoriteDish: async (productId) => {
        try {
            const response = await axiosAuthClient.delete(`/api/users/favorites/${productId}`);
            return {
                success: true,
                message: response.data.message || 'Đã xóa khỏi danh sách yêu thích',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Xóa yêu thích thất bại',
            };
        }
    },
};

export default userService;
