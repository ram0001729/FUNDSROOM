CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20),
  email VARCHAR(100),
  business_name VARCHAR(150),
  gst_number VARCHAR(50),
  type VARCHAR(20) CHECK (type IN ('Retail', 'Wholesale', 'Distributor')),
  address TEXT,
  status VARCHAR(20) CHECK (status IN ('Lead', 'Active', 'Inactive')) DEFAULT 'Active',
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50),
  unit_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2) DEFAULT 0,
  current_stock INT DEFAULT 0,
  reserved_stock INT DEFAULT 0,
  min_stock INT DEFAULT 10,
  location VARCHAR(100),
  expiry_date DATE,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  quantity_changed INT NOT NULL,
  movement_type VARCHAR(10) CHECK (movement_type IN ('IN', 'OUT', 'RESERVE', 'UNRESERVE')),
  reason TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id),
  customer_name VARCHAR(100),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sales_source VARCHAR(20) CHECK (sales_source IN ('ONLINE', 'OFFLINE')) DEFAULT 'OFFLINE',
  status VARCHAR(20) CHECK (status IN ('Created', 'Stock Reserved', 'Dispatched', 'Delivered', 'Cancelled')) DEFAULT 'Created',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id SERIAL PRIMARY KEY,
  sales_order_id INT REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  product_name VARCHAR(100) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS challans (
  id SERIAL PRIMARY KEY,
  challan_number VARCHAR(50) UNIQUE NOT NULL,
  sales_order_id INT REFERENCES sales_orders(id),
  customer_id INT REFERENCES customers(id),
  customer_name VARCHAR(100),
  customer_mobile VARCHAR(20),
  total_quantity INT NOT NULL,
  sales_source VARCHAR(20) CHECK (sales_source IN ('ONLINE', 'OFFLINE')) DEFAULT 'OFFLINE',
  status VARCHAR(20) CHECK (status IN ('Draft', 'Confirmed', 'Dispatched', 'Cancelled')) DEFAULT 'Draft',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challan_items (
  id SERIAL PRIMARY KEY,
  challan_id INT REFERENCES challans(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  product_snapshot_name VARCHAR(100) NOT NULL,
  product_snapshot_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  sales_order_id INT REFERENCES sales_orders(id),
  customer_id INT REFERENCES customers(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('Pending', 'Partial', 'Paid', 'Overdue')) DEFAULT 'Pending',
  due_date DATE,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INT REFERENCES invoices(id),
  customer_id INT REFERENCES customers(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'UPI')),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reference_number VARCHAR(100),
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
