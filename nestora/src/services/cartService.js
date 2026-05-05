import { axiosAuthClient } from '../lib/axios';


export const getMyCart = async () => {
    try {
        const response = await axiosAuthClient.get('/api/cart/my-cart');
        return {
            success: true,
            data: response.data.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Lỗi khi lấy giỏ hàng'
        };
    }
};


export const addToCart = async (productId, quantity = 1) => {
    try {
        const response = await axiosAuthClient.post('/api/cart/add-to-cart', {
            productId,
            quantity
        });
        return {
            success: true,
            data: response.data.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng',
            errors: error.response?.data?.errors
        };
    }
};


export const updateCartItem = async (cartItemId, quantity) => {
    try {
        const response = await axiosAuthClient.put('/api/cart/update-cart-item', {
            cartItemId,
            quantity
        });
        return {
            success: true,
            data: response.data.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Lỗi khi cập nhật giỏ hàng'
        };
    }
};


export const removeFromCart = async (cartItemId) => {
    try {
        const response = await axiosAuthClient.delete(`/api/cart/remove-from-cart/${cartItemId}`);
        return {
            success: true,
            data: response.data.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Lỗi khi xóa sản phẩm khỏi giỏ hàng'
        };
    }
};


export const clearCart = async () => {
    try {
        const response = await axiosAuthClient.delete('/api/cart/clear-cart');
        return {
            success: true,
            data: response.data.data,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: error.response?.data?.message || 'Lỗi khi xóa giỏ hàng'
        };
    }
};
