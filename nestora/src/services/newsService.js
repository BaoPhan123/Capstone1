import { axiosAuthClient, axiosInstance } from '../lib/axios';

const newsService = {
    getAllNews: async (page = 1, limit = 10, category = '', search = '') => {
        try {
            const params = new URLSearchParams();
            if (page) params.append('page', page);
            if (limit) params.append('limit', limit);
            if (category) params.append('category', category);
            if (search) params.append('q', search);

            const queryString = params.toString();
            const url = queryString ? `/api/news/get-news?${queryString}` : '/api/news/get-news';

            const response = await axiosInstance.get(url);
            return {
                success: true,
                data: response.data.data,
                meta: response.data.meta,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy danh sách tin tức thất bại',
            };
        }
    },

    getNewsCategories: async () => {
        try {
            const response = await axiosInstance.get('/api/news/categories');
            return {
                success: true,
                data: response.data.data || [],
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy danh mục tin tức thất bại',
            };
        }
    },

    createNewsCategory: async (payload) => {
        try {
            const response = await axiosAuthClient.post('/api/news/categories', payload);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Tạo danh mục tin tức thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Tạo danh mục tin tức thất bại',
                errors: error.response?.data?.errors,
            };
        }
    },

    getNewsBySlug: async (slug) => {
        try {
            const response = await axiosInstance.get(`/api/news/detail/${slug}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy chi tiết tin tức thất bại',
            };
        }
    },

    createNews: async (newsData) => {
        try {
            const response = await axiosAuthClient.post('/api/news/create-news', newsData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Tạo bài viết thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Tạo bài viết thất bại',
                errors: error.response?.data?.errors,
            };
        }
    },

    updateNews: async (slug, newsData) => {
        try {
            const response = await axiosAuthClient.put(`/api/news/update-news/${slug}`, newsData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Cập nhật bài viết thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật bài viết thất bại',
                errors: error.response?.data?.errors,
            };
        }
    },

    deleteNews: async (slug) => {
        try {
            const response = await axiosAuthClient.delete(`/api/news/delete-news/${slug}`);
            return {
                success: true,
                message: response.data.message || 'Xóa bài viết thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Xóa bài viết thất bại',
            };
        }
    },

    getNewsByCategory: async (category, limit = 10) => {
        try {
            const response = await axiosInstance.get(`/api/news/get-news?category=${encodeURIComponent(category)}&limit=${limit}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy tin tức theo danh mục thất bại',
            };
        }
    },
};

export default newsService;