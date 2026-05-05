import { createContext, useContext, useState, useEffect } from 'react';
import * as cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const fetchCartCount = async () => {
        if (user && !user?.roles?.includes('admin')) {
            setIsLoading(true);
            const result = await cartService.getMyCart();
            if (result.success) {
                setCartCount(result.data.totalItems || 0);
            } else {
                setCartCount(0);
            }
            setIsLoading(false);
        } else {
            setCartCount(0);
        }
    };

    useEffect(() => {
        fetchCartCount();
    }, [user]);

    const refreshCart = () => {
        fetchCartCount();
    };

    return (
        <CartContext.Provider value={{ cartCount, refreshCart, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
