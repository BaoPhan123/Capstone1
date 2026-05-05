import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';
import './styles/admin.css';

// Context
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Protected Route Components
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';

// Layout components
import Header from './components/layout/header';
import Footer from './components/layout/footer';
import AdminLayout from './components/layout/AdminLayout';
import Chatbot from './components/Chatbot';

// Pages
import HomePage from './pages/HomePage';
import NewsPage from './pages/New';
import NewsDetailPage from './pages/NewsDetail';
import AboutPage from './pages/About';
import PartnerPage from './pages/Partner';
import ContactPage from './pages/Contact';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ProductsPage from './pages/Products';
import ProductDetailPage from './pages/ProductDetail';
import ProfilePage from './pages/Profile';
import OrdersPage from './pages/Orders';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import OrderStatusPage from './pages/OrderStatus';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminNews from './pages/admin/AdminNews';
import AdminProfile from './pages/admin/AdminProfile';

// Layout wrapper for main site
const Layout = ({ children }) => {
  return (
    <div id="main-content" className="wrap">
      <Header />
      <main>{children}</main>
      <Footer />
      <Chatbot />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Main Site Routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/news" element={<Layout><NewsPage /></Layout>} />
            <Route path="/news/:slug" element={<Layout><NewsDetailPage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/partners" element={<Layout><PartnerPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

            {/* Auth Routes - Only for guests */}
            <Route path="/login" element={<GuestRoute><Layout><LoginPage /></Layout></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Layout><RegisterPage /></Layout></GuestRoute>} />

            {/* Product Routes */}
            <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
            <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />

            {/* Protected User Routes - Requires authentication */}
            <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Layout><OrdersPage /></Layout></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Layout><CheckoutPage /></Layout></ProtectedRoute>} />
            <Route path="/order-status/:transactionId" element={<ProtectedRoute><Layout><OrderStatusPage /></Layout></ProtectedRoute>} />
            <Route path="/cart" element={<Layout><CartPage /></Layout>} />

            {/* Admin Routes - Requires admin role */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="news" element={<AdminNews />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
