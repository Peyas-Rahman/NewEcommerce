import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App";

// =====================================================
// ADMIN
// =====================================================

import AdminLayout from "./pages/Admin/Layout/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard";

import MenuManagement from "./pages/Admin/MenuManagement/MenuManagement";
import HeaderMenuSettings from "./pages/Admin/MenuManagement/HeaderMenuSettings";

import CategoryManagement from "./pages/Admin/CategoryManagement/CategoryManagement";
import ProductManagement from "./pages/Admin/ProductManagement/ProductManagement";
import OrderManagement from "./pages/Admin/OrderManagement/OrderManagement";
import InventoryManagement from "./pages/Admin/InventoryManagement/InventoryManagement";

import BrandManagement from "./pages/Admin/BrandManagement/BrandManagement";
import CustomerManagement from "./pages/Admin/CustomerManagement/CustomerManagement";
import PaymentManagement from "./pages/Admin/PaymentManagement/PaymentManagement";
import Reports from "./pages/Admin/ReportManagement/ReportManagement";
import { LoginPage, RegisterPage } from "./pages/Customer/Auth/AuthPages";
import CartPage from "./pages/Customer/Cart/CartPage";
import CheckoutPage from "./pages/Customer/Checkout/CheckoutPage";
import OrderSuccessPage from "./pages/Customer/Checkout/OrderSuccessPage";
import CustomerDashboard from "./pages/Customer/Dashboard/CustomerDashboard";
import OrderDetailPage from "./pages/Customer/Dashboard/OrderDetailPage";
import ProductDetailsPage from "./pages/Customer/Shop/ProductDetailsPage";
import ShopPage from "./pages/Customer/Shop/ShopPage";
import ComparePage from "./pages/Customer/Shop/ComparePage";
import WishlistPage from "./pages/Customer/Dashboard/WishlistPage";


// =====================================================
// ROOT
// =====================================================

function Root() {

  const path = window.location.pathname;
  const productMatch = path.match(/^\/product\/(\d+)\/?$/);
  const orderMatch = path.match(/^\/account\/orders\/(\d+)\/?$/);


  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  if (
    path === "/admin" ||
    path === "/admin/"
  ) {
    return (
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN ORDERS
  // =====================================================

  if (path === "/admin/orders") {
    return (
      <AdminLayout>
        <OrderManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN PRODUCTS
  // =====================================================

  if (path === "/admin/products") {
    return (
      <AdminLayout>
        <ProductManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN CATEGORIES
  // =====================================================

  if (path === "/admin/categories") {
    return (
      <AdminLayout>
        <CategoryManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN INVENTORY
  // =====================================================

  if (path === "/admin/inventory") {
    return (
      <AdminLayout>
        <InventoryManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN BRANDS
  // =====================================================

  if (path === "/admin/brands") {
    return (
      <AdminLayout>
        <BrandManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN CUSTOMERS
  // =====================================================

  if (path === "/admin/customers") {
    return (
      <AdminLayout>
        <CustomerManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN PAYMENTS
  // =====================================================

  if (path === "/admin/payments") {
    return (
      <AdminLayout>
        <PaymentManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN REPORTS
  // =====================================================

  if (path === "/admin/reports") {
    return (
      <AdminLayout>
        <Reports />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN MENUS
  // =====================================================

  if (path === "/admin/menus") {
    return (
      <AdminLayout>
        <MenuManagement />
      </AdminLayout>
    );
  }


  // =====================================================
  // ADMIN HEADER SETTINGS
  // =====================================================

  if (path === "/admin/header-settings") {
    return (
      <AdminLayout>
        <HeaderMenuSettings />
      </AdminLayout>
    );
  }


  // =====================================================
  // CUSTOMER AUTHENTICATION
  // =====================================================

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/register") {
    return <RegisterPage />;
  }


  // =====================================================
  // CUSTOMER SHOP
  // =====================================================

  if (path === "/shop" || path === "/shop/") {
    return <ShopPage />;
  }

  if (path === "/compare" || path === "/compare/") {
    return <ComparePage />;
  }

  if (path === "/wishlist" || path === "/wishlist/") {
    return <WishlistPage />;
  }

  if (productMatch) {
    return <ProductDetailsPage id={Number(productMatch[1])} />;
  }


  // =====================================================
  // CUSTOMER PURCHASE FLOW
  // =====================================================

  if (path === "/cart" || path === "/cart/") {
    return <CartPage />;
  }

  if (path === "/checkout" || path === "/checkout/") {
    return <CheckoutPage />;
  }

  if (path === "/order-success") {
    const orderId = new URLSearchParams(window.location.search).get("id");
    return <OrderSuccessPage id={orderId ? Number(orderId) : undefined} />;
  }


  // =====================================================
  // CUSTOMER ACCOUNT
  // =====================================================

  if (path === "/account" || path === "/account/") {
    return <CustomerDashboard />;
  }

  if (orderMatch) {
    return <OrderDetailPage id={Number(orderMatch[1])} />;
  }


  // =====================================================
  // NORMAL WEBSITE
  // =====================================================

  return <App />;
}


// =====================================================
// APPLICATION START
// =====================================================

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <Root />
  </StrictMode>
);