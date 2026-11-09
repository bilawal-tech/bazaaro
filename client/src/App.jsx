import {
  BrowserRouter as Router,
  Routes,
  Route,
  BrowserRouter,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from 'react-hot-toast';
import { selectUser } from "./redux/slices/authSlice"; // 👈 Sahi selector import kiya jo authSlice mein maujood hai

//layout components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import Loader from "./components/common/Loader";
import Toast from "./components/common/Toast";
import ProtectedRoute from "./components/common/ProtectedRoute";

//pages
import HomePage from "./pages/shop/HomePage";
import ShopPage from "./pages/shop/ShopPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import CartPage from "./pages/cart/CartPage";
import CheckoutPage from "./pages/order/CheckoutPage";
import OrderHistoryPage from "./pages/order/OrderHistoryPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import CreateProductPage from "./pages/admin/createProductPage"; 
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";

function App() {
  const user = useSelector(selectUser); 
  
  return (
    <>
    <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        {/* global components */}
        <Toast />
        <Navbar />
        {/* global components */}

        <main className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
             <Route path="/" element={<HomePage />} />
             <Route path="/shop" element={<ShopPage />} /> 
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
             <Route path="/register" element={<RegisterPage />} />
            {/* Public Routes */}

            {/* ── Protected Routes ────────────── */}
            <Route element={<ProtectedRoute />}>
               <Route path="/cart" element={<CartPage />} /> 
              <Route path="/checkout" element={<CheckoutPage />} /> 
              <Route path="/orders" element={<OrderHistoryPage />} /> 
            </Route>
            {/* ── Protected Routes ────────────── */}


            {/* admin only */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} /> 
              <Route path="/admin/products/create" element={<CreateProductPage />} /> 
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} /> 
            </Route>
            {/* admin only */}



            {/* on error */}
            {/* any undefined url is pass in star * path */}
            <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300">404</h1>
                <p className="text-gray-500 mt-2">Page not found</p>
                <a href="/" className="text-blue-500 mt-4 block">
                  Go Home
                </a>
              </div>
            </div>
          } />

          </Routes>
        </main>
        <Footer/>
      </BrowserRouter>
    </>
  );
}

export default App;