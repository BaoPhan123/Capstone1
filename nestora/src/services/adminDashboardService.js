import { axiosAuthClient } from '../lib/axios';

const adminDashboardService = {
    getDashboardStats: async () => {
        try {
            const response = await axiosAuthClient.get('/api/admin/dashboard/stats');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Không thể lấy dữ liệu dashboard',
            };
        }
    },
};

export default adminDashboardService;
