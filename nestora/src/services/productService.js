import { axiosInstance, axiosAuthClient } from '../lib/axios';

const productService = {
    getAllProducts: async () => {
        try {
            const response = await axiosInstance.get('/api/products/get-products');
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy danh sách sản phẩm thất bại',
            };
        }
    },

    getProductById: async (id) => {
        try {
            const response = await axiosInstance.get(`/api/products/product-detail/${id}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy chi tiết sản phẩm thất bại',
            };
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axiosAuthClient.post('/api/products/create-product', productData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message || 'Tạo sản phẩm thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Tạo sản phẩm thất bại',
                errors: error.response?.data?.errors,
            };
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await axiosAuthClient.put(`/api/products/update-product/${id}`, productData);
            return {
                success: true,
                data: response.data.data,
                message: 'Cập nhật sản phẩm thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật sản phẩm thất bại',
                errors: error.response?.data?.errors,
            };
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await axiosAuthClient.delete(`/api/products/delete-product/${id}`);
            return {
                success: true,
                data: response.data.data,
                message: 'Xóa sản phẩm thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Xóa sản phẩm thất bại',
            };
        }
    },

    getProductsByCategory: async (category) => {
        try {
            const response = await axiosInstance.get('/api/products/get-products');
            const filteredProducts = response.data.data.filter(
                product => product.category === category
            );
            return {
                success: true,
                data: filteredProducts,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lấy sản phẩm theo danh mục thất bại',
            };
        }
    },

    searchProducts: async (keyword) => {
        try {
            const response = await axiosInstance.get('/api/products/get-products');
            const filteredProducts = response.data.data.filter(product =>
                product.name.toLowerCase().includes(keyword.toLowerCase()) ||
                (product.desc && product.desc.toLowerCase().includes(keyword.toLowerCase()))
            );
            return {
                success: true,
                data: filteredProducts,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Tìm kiếm sản phẩm thất bại',
            };
        }
    },
};

export const CATEGORIES = {
    'phong-khach': 'Phòng khách',
    'phong-ngu': 'Phòng ngủ',
    'phong-bep': 'Phòng bếp',
    'phong-tam': 'Phòng tắm',
    'tre-em': 'Trẻ em',
    'van-phong': 'Văn phòng',
    'cau-thang': 'Cầu thang',
    'den-trang-tri': 'Đèn trang trí',
};

export const CATEGORY_LIST = Object.keys(CATEGORIES);

export default productService;
