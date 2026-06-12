# BizTrack-OS📒

BizTrack-OS is a cloud-based business operating system built specifically for small and medium-sized businesses in Nigeria. 

---
# The Problem

Most Nigerian small businesses run on notebooks, memory, and manual calculations — leaving owners with no clear picture of their daily sales, stock levels, profits, or outstanding debts. Existing software solutions are either priced in dollars, built for Western workflows, or too complex for the average SME owner to use.

# The Solution
BizTrack-OS was built to close that gap — an affordable, mobile-first business operating system designed around how Nigerian business owners actually work.

It replaces notebooks, calculators, and scattered WhatsApp notes with a unified platform that gives business owners real-time visibility into their sales, stock levels, expenses, profits, and outstanding debts.

## Features

- 💰 Sales Management
  >- Multi-item cart: Add multiple products to a single sale with quantity and negotiated pricing
  >- PDF receipt generation: Auto-generated A6/thermal-ready receipts with business branding
  >- WhatsApp receipt sharing: Send receipts to customers in one tap
  >- Part payment & credit sales: Record full payments, part payments, and full credit sales
  >- Sales history: Full transaction log with search, filter, and void (PIN-protected) capability
  >- Supplier traceability: Track which supplier each restock came from

- 📦 Inventory Management
  >- Live stock levels: Stock auto-deducts on every sale
  >- Reorder alerts: Get notified when products hit their reorder threshold
  >- Stockout projection: See how many days until a product runs out based on sales velocity
  >- Restock log: Log every delivery with supplier details and quantities
  >- Recent deliveries panel: Quick view of the latest stock arrivals
  >- Concurrent-use stock guard: Prevents overselling when multiple users are active

- 🧠 Business Health
  >- Revenue dashboard: Daily, weekly, and monthly revenue with trend charts
  >- Profit & loss: Gross profit, net profit, and expense breakdown
  >- Top products: Identify your best and worst performing products
  >- Expense tracker: Log and categorise business expenses
  >- Insights: Actionable business intelligence from your sales data

- 📕 Debtors Ledger
  >- Credit sale tracking: Every part payment and full credit sale is automatically logged
  >- Outstanding balance view: See every customer's current balance sorted by oldest first
  >- Instalment recording: Log payments against open debts as customers pay
  >- WhatsApp debt reminders: Send polite payment reminders to customers in one tap
  >- Payment history: Full audit trail of every instalment per customer
  >- Manual settle: Mark debts as settled for payments made outside the app



---





## Database Setup

Run the following SQL in your Supabase SQL editor to create the required tables.

### Core Tables

```sql
-- Users / Businesses
CREATE TABLE users (
  id               TEXT PRIMARY KEY,
  business_id      TEXT UNIQUE NOT NULL,
  business_name    TEXT,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT,
  phone            TEXT,
  subscription     TEXT DEFAULT 'trial',
  trial_end        TIMESTAMPTZ,
  sub_end          TIMESTAMPTZ,
  void_pin         TEXT,
  role             TEXT DEFAULT 'owner',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  product_id        TEXT PRIMARY KEY,
  business_id       TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  category          TEXT,
  selling_price     NUMERIC DEFAULT 0,
  cost_price        NUMERIC DEFAULT 0,
  stock_quantity    NUMERIC DEFAULT 0,
  reorder_level     NUMERIC DEFAULT 0,
  base_unit         TEXT DEFAULT 'unit',
  sub_unit          TEXT DEFAULT 'unit',
  units_per_pack    NUMERIC DEFAULT 1,
  selling_price_sub NUMERIC DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
  sale_id          TEXT PRIMARY KEY,
  business_id      TEXT NOT NULL,
  customer_name    TEXT,
  payment_method   TEXT,
  payment_status   TEXT DEFAULT 'full',
  amount_paid_now  NUMERIC DEFAULT 0,
  balance_owed     NUMERIC DEFAULT 0,
  grand_total      NUMERIC DEFAULT 0,
  total_discount   NUMERIC DEFAULT 0,
  total_cost       NUMERIC DEFAULT 0,
  gross_profit     NUMERIC DEFAULT 0,
  note             TEXT,
  sale_time        TIMESTAMPTZ DEFAULT NOW(),
  voided           BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items
CREATE TABLE sale_items (
  item_id          TEXT PRIMARY KEY,
  sale_id          TEXT NOT NULL,
  business_id      TEXT NOT NULL,
  product_id       TEXT,
  product_name     TEXT,
  quantity         NUMERIC DEFAULT 0,
  unit_price       NUMERIC DEFAULT 0,
  negotiated_price NUMERIC DEFAULT 0,
  cost_price       NUMERIC DEFAULT 0,
  line_total       NUMERIC DEFAULT 0,
  discount_amt     NUMERIC DEFAULT 0,
  gross_profit     NUMERIC DEFAULT 0,
  unit_label       TEXT DEFAULT 'unit',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  expense_id       TEXT PRIMARY KEY,
  business_id      TEXT NOT NULL,
  category         TEXT,
  amount           NUMERIC DEFAULT 0,
  description      TEXT,
  expense_date     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Restock Log
CREATE TABLE restock_log (
  restock_id       TEXT PRIMARY KEY,
  business_id      TEXT NOT NULL,
  product_id       TEXT,
  product_name     TEXT,
  quantity_added   NUMERIC DEFAULT 0,
  cost_per_unit    NUMERIC DEFAULT 0,
  supplier_name    TEXT,
  supplier_phone   TEXT,
  note             TEXT,
  restock_date     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Debts (Part payments & credit sales)
CREATE TABLE debts (
  debt_id          TEXT PRIMARY KEY,
  business_id      TEXT NOT NULL,
  sale_id          TEXT,
  customer_name    TEXT,
  customer_phone   TEXT,
  total_amount     NUMERIC DEFAULT 0,
  amount_paid      NUMERIC DEFAULT 0,
  balance          NUMERIC DEFAULT 0,
  sale_date        TIMESTAMPTZ,
  status           TEXT DEFAULT 'unpaid',
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Debt Payment Instalments
CREATE TABLE debt_payments (
  dpay_id          TEXT PRIMARY KEY,
  debt_id          TEXT NOT NULL,
  business_id      TEXT NOT NULL,
  amount           NUMERIC DEFAULT 0,
  payment_date     TIMESTAMPTZ,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### Recommended Indexes

```sql
CREATE INDEX idx_sales_business_date    ON sales(business_id, sale_time);
CREATE INDEX idx_products_business      ON products(business_id);
CREATE INDEX idx_sale_items_business    ON sale_items(business_id);
CREATE INDEX idx_expenses_business_date ON expenses(business_id, expense_date);
CREATE INDEX idx_debts_business_status  ON debts(business_id, status);
CREATE INDEX idx_restock_business       ON restock_log(business_id);
```

### Row Level Security

```sql
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
```

---

## Deployment

### Streamlit Community Cloud (Recommended for getting started)

1. Push your code to a GitHub repository
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your repository and set `suite_home.py` as the entry point
4. Add your Supabase secrets in the **Secrets** section of the app settings
5. Deploy

### Self-hosted (Recommended for production)

```bash
# Install on a VPS (Ubuntu)
pip install -r requirements.txt
streamlit run suite_home.py --server.port 8501 --server.headless true
```

Use **nginx** as a reverse proxy and **systemd** to keep the process alive.

---

## Pricing

| Plan | Price | Duration |
|---|---|---|
| Free Trial | ₦0 | 14 days |
| Monthly | ₦1,500 | 30 days |
| Yearly | ₦15,000 | 365 days |

---

## Contact & Support

Built and maintained by **Abdul** — Founder, Bayantx360

- 🐦 Twitter/X: [@abdul_git07](https://twitter.com/abdul_git07)
- 💻 GitHub: [Abdul-WriteCodes](https://github.com/Abdul-WriteCodes)
- 📝 Blog: [abdulbuilds.blogspot.com](https://abdulbuilds.blogspot.com)
- 💬 WhatsApp Support: [+234 813 636 2633](https://wa.me/2348136362633)

---

## License

This project is proprietary software owned by Bayantx360.
All rights reserved © 2026 BizTrack-OS.

---

*Built for Nigerian SMEs 🇳🇬 — because your business deserves better tools.*
