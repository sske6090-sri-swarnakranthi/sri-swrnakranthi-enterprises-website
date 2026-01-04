import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Profile from './pages/Profile'
import CheckoutPage from './pages/CheckoutPage'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import { WishlistProvider } from './WishlistContext'
import SearchResults from './pages/SearchResults'
import ScrollToTop from './pages/ScrollToTop'
import OrderCheckout from './pages/OrderCheckout'
import OrderTracking from './pages/OrderTracking'
import ReturnsPage from './pages/ReturnsPage'
import OrderDetails from './pages/OrderDetails'
import PaymentPage from './pages/PaymentPage'
import Home1 from './pages/Home1'
import TrackOrder from './pages/TrackOrder'
import OrderCancel from './pages/OrderCancel'
import RefundRequest from './pages/RefundRequest'
import ProductsPage from './pages/ProductsPage'
import CustomizationPage from './pages/CustomizationPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'

function AppShell() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home1 />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/customization" element={<CustomizationPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/order/checkout" element={<OrderCheckout />} />
        <Route path="/track/:id" element={<OrderTracking />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/order/:id" element={<OrderDetails />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/order/:id/tracking" element={<OrderTracking />} />
        <Route path="/order/:id/cancel" element={<OrderCancel />} />
        <Route path="/returns/:id/refund" element={<RefundRequest />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <WishlistProvider>
      <Router>
        <div className="App">
          <AppShell />
        </div>
      </Router>
    </WishlistProvider>
  )
}
