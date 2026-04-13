
# Project Plan - InventoryForge

**Project Name**: InventoryForge  
**Type**: SME Inventory Management System (Hackathon Submission)  
**Developer**: Solo (Dristi)  
**Tech Stack**: Next.js 15 (App Router) + TypeScript + Supabase + Tailwind + shadcn/ui  
**Deadline**: 15 April 2026  
**Target Build Time**: 2 Focused Days (Today + Tomorrow)

## 1. Project Goal
Build a modern, real-time, cloud-connected Inventory Management System that streamlines **Procurement, Sales, and Manufacturing (WIP)** for Small and Medium Enterprises (SMEs).  
The application must fully cover the hackathon problem statement while adding unique features that make it stand out and win.

## 2. Final Feature List

### Core Features (Must Cover 100% of Problem Statement)

**Inventory Management**
- Product master with fields: `product_code`, `name`, `description`, `weight_kg`, `selling_price`, `cost_price`, `current_quantity`, `last_updated`
- Automatic real-time stock updates on sales, purchases, and manufacturing events
- Product search, filter, and low-stock highlighting

**Sales Orders**
- Create sales order with multiple products (qty + rate)
- Visual order stages: **Quotation → Confirmed → Packing → Dispatched → Completed**
- Auto deduct stock when status changes to "Dispatched"
- Order history with filters

**Purchase Orders**
- Create purchase order with multiple products
- Stages: **Draft → Ordered → Received → Completed**
- Auto increase stock when status changes to "Received"

**Manufacturing (WIP) Tracking**
- Create manufacturing batch: select raw materials (consume qty) + output product + output qty
- Status: **Pending → In Progress → Completed**
- On "Completed": auto deduct raw materials + add finished goods to inventory
- Visual Kanban board for batches

**Dashboard & Reporting**
- Overview dashboard with key metric cards
- Unified history table with filters (Sales / Purchase / Manufacturing + date + status)
- Basic analytics charts (stock movement, top products)

**UI/UX**
- Clean modern enterprise design with sidebar navigation
- Fully responsive (mobile-friendly)
- Dark / Light mode toggle
- Toast notifications
- Real-time updates via Supabase Realtime

### Unique Winning Features (Differentiators)

1. **Smart Reorder Engine**
   - Calculate average daily sales from last 30 days
   - Show "Suggested Reorder" cards on dashboard with one-click Purchase Order creation

2. **Visual Manufacturing Kanban Board**
   - Drag-and-drop interface for WIP batches (Pending / In Progress / Completed)

3. **QR Code Generation & Scanning**
   - Auto-generate QR code for each product
   - "Scan to Receive Stock" feature using phone camera

4. **Stock Analytics Dashboard**
   - Recharts: Line chart (stock movement), Bar chart (top 5 products), Pie chart (stock value)

5. **Bulk CSV Import / Export**
   - Import products from CSV
   - Export inventory/orders to CSV

6. **Professional PDF Generation + WhatsApp Share**
   - Generate PDF for Sales Order, Purchase Order, or Manufacturing Batch
   - One-click WhatsApp share button

7. **PWA Support** (Installable app on phone/desktop)

8. **Stock Audit Log**
   - Track every stock change with reason and timestamp

## 3. Database Schema (Supabase)

All tables are defined in the Supabase SQL Editor:
- `products`
- `sales_orders` + `sales_order_items`
- `purchase_orders` + `purchase_order_items`
- `manufacturing_batches` + `manufacturing_raw_materials`
- `stock_audit_log`

(Full SQL schema is available in `seed.sql` and Supabase dashboard)

## 4. Folder Structure
inventory-forge/
├── app/
│   ├── dashboard/page.tsx
│   ├── products/page.tsx
│   ├── sales/page.tsx
│   ├── purchases/page.tsx
│   ├── manufacturing/page.tsx
│   ├── history/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn components
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   ├── manufacturing/
│   ├── common/              # Sidebar, Header, QRCode, Scanner
│   └── pdf/
├── lib/
│   └── supabase/
├── hooks/
├── types/
├── utils/
├── seed.sql
└── README.md


## 5. Day-wise Execution Plan

### Day 1 (Today - Foundation & Core)
- Hours 0-2: Project setup, Supabase connection, run schema, add seed data
- Hours 2-5: Product CRUD + automatic stock logic + audit log
- Hours 5-9: Sales Orders + Purchase Orders (forms + status updates + stock impact)
- Hours 9-12: Manufacturing Batch creation + basic dashboard cards

**Day 1 Goal**: Fully working Products, Sales, Purchases, and basic Manufacturing with stock updates.

### Day 2 (Tomorrow - Polish & Winning Features)
- Hours 0-4: Manufacturing Kanban board + Realtime updates
- Hours 4-7: Dashboard with charts + Smart Reorder suggestions
- Hours 7-10: QR Code generation + Scan feature + PDF generation
- Hours 10-12: CSV Import/Export + WhatsApp share + PWA + Final UI polish

**Day 2 Goal**: Add all unique features, make UI beautiful, prepare documentation and demo.

**Post-Build Tasks**
- Deploy on Vercel
- Record 2-3 minute demo video
- Write 1-2 page documentation PDF
- Update README.md with setup instructions
- Submit GitHub link + documentation

## 6. Key Components & Routes

**Main Routes**:
- `/dashboard`
- `/products`
- `/sales`
- `/purchases`
- `/manufacturing`
- `/history`

**Important Components**:
- `SidebarNav`
- `DashboardCards`
- `ProductTable`, `ProductForm`
- `OrderForm`, `OrderStageProgress`, `OrderTable`
- `ManufacturingKanban`, `BatchForm`, `BatchCard`
- `QRCodeDisplay`, `QRScanner`
- `ReorderSuggestions`
- `StockMovementChart`
- `GeneratePDFButton`

## 7. Success Criteria for Winning
- 100% coverage of problem statement
- Real-time stock updates visible across pages
- Professional, responsive UI with dark mode
- At least 4 unique features working smoothly
- Clean code + good documentation
- Demo-ready with rich seed data

**Let's Build & Win!** 🚀

---

You can now copy the entire content above and save it as `PROJECT_PLAN.md`.

Once done, reply with **"PLAN COPIED"** and I’ll give you the next piece (e.g., exact commands to set up the project + full Supabase schema again for easy copy, or start with the first code files).

You're all set for a strong, organized solo build. Good luck! 🔥