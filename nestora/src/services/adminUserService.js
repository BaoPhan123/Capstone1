import { axiosAuthClient } from '../lib/axios';

const adminUserService = {
    // 1. Lấy danh sách người dùng
    getUsers: async (params = {}) => {
        try {
            const response = await axiosAuthClient.get('/api/admin/users', { params });
            return {
                success: true,
                data: response.data.data,
                pagination: response.data.pagination,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy danh sách người dùng',
                error: error.response?.data,
            };
        }
    },

    // 2. Xem chi tiết người dùng
    getUserDetail: async (userId) => {
        try {
            const response = await axiosAuthClient.post('/api/admin/users/detail', {
                id: userId,
            });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không tìm thấy người dùng',
                error: error.response?.data,
            };
        }
    },

    // 3. Cập nhật thông tin người dùng
    updateUser: async (userId, userData) => {
        try {
            const response = await axiosAuthClient.put(`/api/admin/users/${userId}`, userData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Cập nhật thông tin người dùng thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật thông tin thất bại',
                error: error.response?.data,
            };
        }
    },

    // 4. Khóa tài khoản (soft delete)
    blockUser: async (userId) => {
        try {
            const response = await axiosAuthClient.delete(`/api/admin/users/${userId}`);
            return {
                success: true,
                message: response.data.message || 'Đã khóa tài khoản người dùng',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Khóa tài khoản thất bại',
                error: error.response?.data,
            };
        }
    },

    // 5. Xóa vĩnh viễn người dùng
    deleteUserPermanent: async (userId) => {
        try {
            const response = await axiosAuthClient.delete(`/api/admin/users/${userId}/permanent`);
            return {
                success: true,
                message: response.data.message || 'Đã xóa vĩnh viễn người dùng và dữ liệu liên quan',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Xóa người dùng thất bại',
                error: error.response?.data,
            };
        }
    },

    // 6. Xem đơn hàng của người dùng
    getUserOrders: async (params) => {
        try {
            const response = await axiosAuthClient.post('/api/admin/users/orders', params);
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

    // 7. Cập nhật trạng thái
    updateUserStatus: async (userId, status) => {
        try {
            const response = await axiosAuthClient.put('/api/admin/users/status', {
                id: userId,
                status,
            });
            return {
                success: true,
                data: response.data.data,
                message: 'Cập nhật trạng thái thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật trạng thái thất bại',
                error: error.response?.data,
            };
        }
    },

    // 8. Cập nhật vai trò
    updateUserRoles: async (userId, roles) => {
        try {
            const response = await axiosAuthClient.put('/api/admin/users/roles', {
                id: userId,
                roles,
            });
            return {
                success: true,
                data: response.data.data,
                message: 'Cập nhật vai trò thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật vai trò thất bại',
                error: error.response?.data,
            };
        }
    },

    // 9. Đặt lại mật khẩu
    resetPassword: async (userId, newPassword) => {
        try {
            const response = await axiosAuthClient.put(`/api/admin/users/${userId}/reset-password`, {
                newPassword,
            });
            return {
                success: true,
                message: response.data.message || 'Đặt lại mật khẩu thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Đặt lại mật khẩu thất bại',
                error: error.response?.data,
            };
        }
    },

    // 10. Thống kê người dùng
    getUserStatistics: async (params = {}) => {
        try {
            const response = await axiosAuthClient.get('/api/admin/users/statistics', { params });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy thống kê người dùng',
                error: error.response?.data,
            };
        }
    },

    // 11. Cập nhật trạng thái hàng loạt
    bulkUpdateStatus: async (userIds, status) => {
        try {
            const response = await axiosAuthClient.put('/api/admin/users/bulk-status', {
                userIds,
                status,
            });
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || `Đã cập nhật trạng thái ${userIds.length} người dùng`,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật hàng loạt thất bại',
                error: error.response?.data,
            };
        }
    },

    // 12. Export dữ liệu người dùng
    exportUsers: async (params = {}) => {
        try {
            const response = await axiosAuthClient.get('/api/admin/users/export', { params });
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Export dữ liệu thất bại',
                error: error.response?.data,
            };
        }
    },
};

export default adminUserService;
