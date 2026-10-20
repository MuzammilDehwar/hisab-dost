# Hisab Dost (حساب دوست) - Shopkeeper Accounting PWA

**Hisab Dost** is a simple, reliable, mobile-first Progressive Web App (PWA) designed specifically for small shopkeepers, Kiryana stores (کریانہ اسٹور), cosmetics retailers, clothing shops, home businesses, and online resellers in Pakistan.

The app is free, lightweight, privacy-first, and provides complete localization in **Urdu (اردو)** with native Right-to-Left (RTL) support, **Roman Urdu** for easy phonetics, and **English**.

---

## 🌟 Key Features

1. **Mobile-First Counter Dashboard**:
   - Today's Gross Sales, Expenses, and Estimated Net Profit.
   - Total Customer Credit / Khata (کل ادھار).
   - Cash in Drawer estimation (نقد کیش دراز).
   - Instant touch-friendly quick action buttons for single-handed counter operation.

2. **Customer Khata (گاہک کا کھاتہ و ادھار)**:
   - Full debtor list with remaining balances and credit limits.
   - Customer account statement timeline (Date, Type, Description, Amount, Running Balance).
   - **1-Click WhatsApp Reminder**: Pre-composed polite reminder message in Urdu or Roman Urdu with the customer's exact outstanding amount, opening WhatsApp directly.
   - Cash received (`Got Payment`) and Credit sales (`Gave Credit`) with instant balance recalculation.

3. **Sales & Expenses Registers**:
   - Quick lump-sum entries or line-item sales from inventory.
   - Cash, Credit (Khata), and Online (EasyPaisa / JazzCash / Bank) payment methods.
   - Expense categorization (Rent, Electricity/Utilities, Freight, Wages, Packaging, Tea/Hospitality, Repairs, Miscellaneous).
   - Category expense breakdown visualization.

4. **Product Inventory & Stock Register (اسٹاک و مال)**:
   - Cost price, selling price, current quantity, and units (`کلو / Kg`, `دانہ / Pcs`, `پیکٹ / Pkt`, `درجن / Dozen`, `لیٹر / Ltr`).
   - Automated low-stock warning alerts (`<= minStockThreshold`).
   - Quick stock adjustment tool (+ Received shipment / - Damaged or returned).
   - Auto-deduction of inventory quantities when selling products.

5. **Daily Closing Statement & Reports**:
   - Gross Sales, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Estimated Net Profit.
   - Cash drawer reconciliation (Cash in from sales & recoveries minus cash paid in expenses).
   - Printable Cash Memo / Receipt voucher and Daily Closing register.
   - **CSV / Excel Export**: One-click download with UTF-8 BOM encoding so Urdu and English appear crystal clear in Microsoft Excel.

6. **Privacy-First & Offline-Ready PWA**:
   - **Zero Cloud Leakage**: 100% client-side local persistence (`localStorage`). No customer names, phone numbers, or accounting numbers are ever transmitted to any external server or analytics tracker.
   - **JSON Backup & Restore**: Shopkeepers can download a `.json` backup file of their entire ledger to their phone or computer at any time, and restore it on any device.
   - **Installable PWA**: Works offline through service worker caching (`vite-plugin-pwa`). Includes custom in-app install buttons for Android/Chrome and guided step-by-step instructions for iOS Safari.

---

## 🔒 Data Storage & Privacy Architecture

- **Where is data stored?**
  All records (`sales`, `expenses`, `customers`, `customerTransactions`, `products`, `settings`) are stored exclusively in the browser's local storage under `hisabdost_app_state_v1`.
- **Limitations**:
  Clearing browser cookies and site data will reset local storage. For this reason, Hisab Dost provides an explicit **Download Backup (.json)** button in Settings, allowing shopkeepers to safeguard their ledgers offline.
- **Privacy Assurance**:
  No third-party trackers, Google Analytics, Facebook Pixel, or telemetry scripts are integrated.
- **Future Advertising Integration Point**:
  The application is completely ad-free. A dedicated placeholder and documentation block are reserved in `src/views/SettingsView.tsx` (`FUTURE_AD_SLOT_RESERVED`) for future non-intrusive, privacy-respecting advertising if needed.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Tooling**: Vite 8 with `@tailwindcss/vite` (Tailwind CSS v4)
- **PWA Integration**: `vite-plugin-pwa` with Workbox service worker caching
- **Icons**: `lucide-react`
- **Typography**: Google Fonts (`Noto Sans Arabic` + `Plus Jakarta Sans`)

---

## 🚀 Setup & Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```
   Produces a production-ready, precached static build in `dist/`.

4. **Lint and Type Check**:
   ```bash
   npm run lint
   ```

---

## 📋 Verification & Testing Checklist

- [x] **Calculations Verified**:
  - Net Profit = Gross Sales - Cost of Goods Sold - Operating Expenses.
  - Customer Balances = Initial Balance + Sum of Credit Sales - Sum of Cash Payments.
  - Cash in Drawer = Today's Cash Sales + Today's Cash Customer Recoveries - Today's Cash Expenses.
- [x] **Persistence Tested**: Data changes across Sales, Expenses, Khata, and Inventory persist after full page refresh.
- [x] **RTL & Multilingual**: Urdu Right-To-Left layout renders cleanly; switches seamlessly between Urdu, Roman Urdu, and English.
- [x] **PWA Installability**: Web App Manifest configured with `192x192`, `512x512`, and maskable icons.
- [x] **Offline Status**: Displays clear offline status indicator when internet is disconnected without interrupting counter sales.
- [x] **Backup & Restore**: Generates valid JSON export files and verifies imports safely.
