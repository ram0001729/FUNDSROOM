import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Products from './pages/Products';
import StockLog from './pages/StockLog';
import Challans from './pages/Challans';
import Leads from './pages/crm/Leads';
import FollowUps from './pages/crm/FollowUps';
import Notes from './pages/crm/Notes';

import Landing from './pages/Landing';

import Billing from './pages/Billing';
import Reports from './pages/Reports';
import RecordSale from './pages/RecordSale';
import Settings from './pages/Settings';
import BusinessSettings from './pages/BusinessSettings';
import Placeholder from './pages/Placeholder';

// New Workflow Components
import SalesOrders from './pages/SalesOrders';
import WarehouseDispatch from './pages/WarehouseDispatch';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import OnlineSales from './pages/OnlineSales';
import OfflineSales from './pages/OfflineSales';
import StockOverview from './pages/inventory/StockOverview';
import StockIn from './pages/inventory/StockIn';
import StockOut from './pages/inventory/StockOut';
import LowStock from './pages/inventory/LowStock';
import Warehouses from './pages/inventory/Warehouses';

import Purchases from './pages/Purchases';
import Outstanding from './pages/Outstanding';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stock-log" element={<StockLog />} />
          <Route path="/challans" element={<Challans />} />
          
          <Route path="/transactions" element={<RecordSale />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/business-settings" element={<BusinessSettings />} />
          
          {/* Newly added routes for nested navigation */}
          <Route path="/customers/new" element={<Placeholder title="Add Customer" />} />
          <Route path="/customers/accounts" element={<Placeholder title="Customer Accounts" />} />
          
          <Route path="/sales/orders" element={<SalesOrders />} />
          <Route path="/sales/online" element={<OnlineSales />} />
          <Route path="/sales/offline" element={<OfflineSales />} />
          <Route path="/sales/recent" element={<Placeholder title="Recent Sales" />} />
          
          <Route path="/inventory/stock" element={<StockOverview />} />
          <Route path="/inventory/in" element={<StockIn />} />
          <Route path="/inventory/out" element={<StockOut />} />
          <Route path="/inventory/low-stock" element={<LowStock />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/inventory/adjustment" element={<Placeholder title="Stock Adjustment" />} />
          
          <Route path="/crm/leads" element={<Leads />} />
          <Route path="/crm/follow-ups" element={<FollowUps />} />
          <Route path="/crm/notes" element={<Notes />} />
          
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/orders" element={<Purchases />} />
          <Route path="/purchases/receive" element={<Purchases />} />
          
          <Route path="/dispatch/pending" element={<WarehouseDispatch />} />
          <Route path="/dispatch/completed" element={<Placeholder title="Dispatched Orders" />} />
          
          <Route path="/invoices/pending" element={<Invoices />} />
          <Route path="/invoices/paid" element={<Invoices />} />
          <Route path="/invoices/overdue" element={<Invoices />} />
          
          <Route path="/payments/record" element={<Payments />} />
          <Route path="/payments/history" element={<Payments />} />
          <Route path="/payments/outstanding" element={<Outstanding />} />
          
          <Route path="/reports/sales" element={<Reports defaultMetric="sales" />} />
          <Route path="/reports/stock" element={<Products />} />
          <Route path="/reports/payments" element={<Payments />} />
          <Route path="/reports/outstanding" element={<Outstanding />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
