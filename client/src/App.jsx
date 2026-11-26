import {
  Routes,
  Route,
  BrowserRouter,
} from "react-router-dom";
import { Toaster } from 'react-hot-toast';

//layout components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Toast from "./components/common/Toast";
import ScrollToTop from "./components/common/ScrollToTop";
import PageViewTracker from "./components/common/PageViewTracker";
import ProtectedRoute from "./components/common/ProtectedRoute";

//pages
import HomePage from "./pages/shop/HomePage";
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import CartPage from "./pages/cart/CartPage";
import CheckoutPage from "./pages/order/CheckoutPage";
import PaymentPage from "./pages/order/PaymentPage";
import OrderHistoryPage from "./pages/order/OrderHistoryPage";
import OrderDetailPage from "./pages/order/OrderDetailPage";
import ProfilePage from "./pages/auth/ProfilePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import CreateProductPage from "./pages/admin/createProductPage"; 
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <>
    <Toaster
      position="top-right"
      containerStyle={{ top: 76 }}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#14221B',
          border: '1px solid #E3E9E5',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(20, 34, 27, 0.12)',
          fontSize: '14px',
          fontWeight: 500,
          padding: '12px 14px',
          maxWidth: '360px',
        },
        success: { iconTheme: { primary: '#2D6A4F', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' }, duration: 4000 },
      }}
    />
      <BrowserRouter>
        {/* layout: navbar, toasts */}
        <ScrollToTop />
        <PageViewTracker />
        <Toast />
        <Navbar />
        {/* layout: navbar, toasts */}

        <main className="min-h-screen bg-surface">
          <Routes>
            {/* Public Routes */}
             <Route path="/" element={<HomePage />} />
             <Route path="/shop" element={<ShopPage />} /> 
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
             <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            {/* Public Routes */}

            {/* ── Protected Routes ────────────── */}
            <Route element={<ProtectedRoute />}>
               <Route path="/cart" element={<CartPage />} /> 
              <Route path="/checkout" element={<CheckoutPage />} /> 
              <Route path="/pay/:orderId" element={<PaymentPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} /> 
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            {/* ── Protected Routes ────────────── */}


            {/* admin only */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} /> 
              <Route path="/admin/products/create" element={<CreateProductPage />} /> 
              <Route path="/admin/products/:id/edit" element={<CreateProductPage />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} /> 
            </Route>
            {/* admin only */}



            {/* on error */}
            {/* any undefined url is pass in star * path */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </main>
        <Footer/>
      </BrowserRouter>
    </>
  );
}

export default App;