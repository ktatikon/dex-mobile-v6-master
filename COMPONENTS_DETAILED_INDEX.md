# 🎨 DEX Mobile v6 - Components Detailed Index

## 📋 **Component Architecture Overview**

This document provides a comprehensive index of all React components in the DEX Mobile v6 application, organized by functionality and purpose.

---

## 🏠 **Core Application Components**

### **`App.tsx`**
- **Purpose:** Main application component with routing and provider setup
- **Features:** Route configuration, context providers, error boundaries
- **Providers:** Auth, Admin, KYC, MarketData, Theme, Language
- **Dependencies:** React Router, multiple context providers
- **Key Routes:** Home, Trade, Wallet, Auth, Admin

### **`DexHeader.tsx`**
- **Purpose:** Main application header with navigation and wallet connection
- **Features:** Logo, navigation menu, wallet connection button, user menu
- **Props:** `wallet`, `onConnectWallet`, `onDisconnectWallet`
- **Responsive:** Mobile hamburger menu, desktop navigation bar

### **`DexNavigation.tsx`**
- **Purpose:** Primary navigation component for desktop
- **Features:** Menu items, active state highlighting, user permissions
- **Navigation:** Home, Trade, Portfolio, Wallet, Settings
- **Permissions:** Admin routes, KYC-gated features

### **`DexBottomNav.tsx`**
- **Purpose:** Mobile bottom navigation bar
- **Features:** Touch-optimized navigation, active state indicators
- **Icons:** Home, Trade, Portfolio, Wallet, More
- **Mobile-First:** Optimized for mobile touch interactions

---

## 🎨 **UI Foundation Components** (`/src/components/ui/`)

### **Form Components**
#### **`button.tsx`**
- **Purpose:** Customizable button component with multiple variants
- **Variants:** default, destructive, outline, secondary, ghost, link
- **Sizes:** default, sm, lg, icon
- **Features:** Loading states, disabled states, icon support

#### **`input.tsx`**
- **Purpose:** Form input component with validation states
- **Features:** Error states, placeholder text, icon support
- **Types:** text, email, password, number, search
- **Validation:** Built-in validation state styling

#### **`select.tsx`**
- **Purpose:** Dropdown select component
- **Features:** Search functionality, multi-select, custom options
- **Accessibility:** Keyboard navigation, screen reader support
- **Styling:** Consistent with design system

### **Layout Components**
#### **`card.tsx`**
- **Purpose:** Container card component for content grouping
- **Variants:** default, elevated, outlined
- **Components:** Card, CardHeader, CardContent, CardFooter
- **Usage:** Portfolio cards, transaction items, settings panels

#### **`dialog.tsx`**
- **Purpose:** Modal dialog component for overlays
- **Features:** Backdrop click to close, escape key handling
- **Components:** Dialog, DialogContent, DialogHeader, DialogFooter
- **Accessibility:** Focus management, ARIA attributes

#### **`tabs.tsx`**
- **Purpose:** Tabbed interface component
- **Features:** Keyboard navigation, active state management
- **Components:** Tabs, TabsList, TabsTrigger, TabsContent
- **Usage:** Settings pages, trading interfaces, portfolio views

### **Feedback Components**
#### **`toast.tsx`**
- **Purpose:** Notification toast system
- **Types:** success, error, warning, info
- **Features:** Auto-dismiss, action buttons, positioning
- **Integration:** Global toast provider, programmatic API

#### **`badge.tsx`**
- **Purpose:** Status and label badges
- **Variants:** default, secondary, destructive, outline
- **Usage:** Status indicators, labels, counts
- **Styling:** Consistent sizing and colors

#### **`avatar.tsx`**
- **Purpose:** User avatar component
- **Features:** Image fallback, initials generation, status indicators
- **Sizes:** sm, md, lg, xl
- **Usage:** User profiles, chat interfaces, admin panels

---

## 💰 **Wallet Management Components** (`/src/components/wallet/`)

### **`WalletSwitcher.tsx`**
- **Purpose:** Multi-wallet selection and switching interface
- **Features:** Wallet list, balance display, quick switching
- **Integration:** Unified wallet service, balance tracking
- **UI:** Dropdown interface with wallet details

### **`WalletConnectionCard.tsx`**
- **Purpose:** Individual wallet connection display card
- **Features:** Wallet info, connection status, action buttons
- **Actions:** Connect, disconnect, view details, settings
- **Status:** Connected, disconnected, error states

### **`WalletDeleteModal.tsx`**
- **Purpose:** Wallet deletion confirmation modal
- **Features:** Security warnings, confirmation input, backup reminders
- **Safety:** Multiple confirmation steps, irreversible action warnings
- **Integration:** Wallet service deletion methods

### **`WalletRenameModal.tsx`**
- **Purpose:** Wallet renaming interface
- **Features:** Name validation, duplicate checking, instant preview
- **Validation:** Character limits, special character handling
- **UX:** Real-time validation feedback

### **`SeedPhraseBackupModal.tsx`**
- **Purpose:** Seed phrase backup and verification interface
- **Features:** Secure display, verification quiz, backup confirmation
- **Security:** Blur protection, screenshot prevention warnings
- **Flow:** Display → Verify → Confirm backup completion

---

## 🔄 **Swap & Trading Components** (`/src/components/swap_block/`)

### **`SwapBlock.tsx`**
- **Purpose:** Main swap interface container
- **Features:** Token selection, amount input, swap execution
- **Integration:** DEX services, price quotes, slippage settings
- **State:** Token pairs, amounts, transaction status

### **`TokenSelector.tsx`**
- **Purpose:** Token selection interface with search and filtering
- **Features:** Token search, balance display, popular tokens
- **Data:** Token metadata, prices, balances, logos
- **UX:** Search autocomplete, recent tokens, favorites

### **`SwapForm.tsx`**
- **Purpose:** Swap form with input validation and preview
- **Features:** Amount input, balance checking, swap preview
- **Validation:** Insufficient balance, minimum amounts, slippage
- **Integration:** Quote services, balance checking

### **`TransactionDetailsModal.tsx`**
- **Purpose:** Transaction details and confirmation modal
- **Features:** Transaction summary, gas estimates, confirmation
- **Details:** Token amounts, exchange rates, fees, estimated time
- **Actions:** Confirm, cancel, adjust settings

---

## 📊 **Trading Components** (`/src/components/trade/`)

### **`AdvancedTradingPanel.tsx`**
- **Purpose:** Professional trading interface
- **Features:** Order placement, position management, advanced orders
- **Order Types:** Market, limit, stop-loss, take-profit
- **Integration:** Trading services, real-time data, order book

### **`TradingChart.tsx`**
- **Purpose:** Advanced price charts with technical analysis
- **Features:** Candlestick charts, technical indicators, drawing tools
- **Indicators:** Moving averages, RSI, MACD, Bollinger Bands
- **Library:** Lightweight Charts, custom indicators

### **`OrderBook.tsx`**
- **Purpose:** Real-time order book display
- **Features:** Bid/ask orders, depth visualization, price levels
- **Real-time:** WebSocket updates, order aggregation
- **Interaction:** Click to place orders, depth analysis

---

## 📱 **Mobile Components** (`/src/components/mobile/`)

### **`MobileLayout.tsx`**
- **Purpose:** Mobile-specific layout wrapper
- **Features:** Touch-optimized spacing, mobile navigation
- **Responsive:** Breakpoint detection, mobile-first design
- **Navigation:** Bottom navigation, swipe gestures

### **`MobileNavigation.tsx`**
- **Purpose:** Mobile navigation system
- **Features:** Bottom tab bar, hamburger menu, swipe navigation
- **Icons:** Touch-optimized icons, active state indicators
- **Accessibility:** Touch targets, screen reader support

---

## 🆔 **KYC Components** (`/src/components/kyc/`)

### **`KYCForm.tsx`**
- **Purpose:** KYC verification form interface
- **Features:** Document upload, personal information, verification steps
- **Steps:** Personal info, document upload, verification, completion
- **Integration:** KYC service, document validation, status tracking

### **`AadhaarEKYCPage.tsx`**
- **Purpose:** Aadhaar eKYC verification interface
- **Features:** Aadhaar number input, OTP verification, biometric capture
- **Compliance:** Indian government regulations, secure data handling
- **Integration:** Aadhaar APIs, verification services

---

## 👤 **Admin Components** (`/src/components/admin/`)

### **`AdminDashboard.tsx`**
- **Purpose:** Admin control panel interface
- **Features:** User management, system metrics, configuration
- **Metrics:** User statistics, transaction volumes, system health
- **Actions:** User actions, system configuration, monitoring

### **`AdminUserManagement.tsx`**
- **Purpose:** User management interface for admins
- **Features:** User search, status management, permissions
- **Actions:** Enable/disable users, reset passwords, view details
- **Permissions:** Role-based access, audit logging

---

## 📊 **Chart Components** (`/src/components/charts/`)

### **`PriceChart.tsx`**
- **Purpose:** Price chart display component
- **Features:** Real-time price updates, multiple timeframes
- **Chart Types:** Line, candlestick, area charts
- **Integration:** Chart data service, real-time updates

### **`PortfolioChart.tsx`**
- **Purpose:** Portfolio performance visualization
- **Features:** Asset allocation, performance tracking, historical data
- **Charts:** Pie charts, line charts, bar charts
- **Data:** Portfolio analytics, asset breakdown

---

## 🔧 **Utility Components**

### **`ErrorBoundary.tsx`**
- **Purpose:** Error boundary for React component error handling
- **Features:** Error catching, fallback UI, error reporting
- **Recovery:** Retry mechanisms, error details, user guidance
- **Logging:** Error tracking, stack traces, user context

### **`SkeletonLoader.tsx`**
- **Purpose:** Loading skeleton components
- **Features:** Animated placeholders, responsive sizing
- **Variants:** Card skeletons, list skeletons, chart skeletons
- **UX:** Smooth loading transitions, content shape matching

### **`PerformanceMonitor.tsx`**
- **Purpose:** Performance monitoring and debugging
- **Features:** Render time tracking, memory usage, component profiling
- **Development:** Debug mode only, performance metrics
- **Integration:** Performance hooks, monitoring services

---

## 🎨 **Design System Integration**

### **Color Scheme**
- **Primary:** `#B1420A` (dark orange)
- **Background:** `#000000` (black), `#1C1C1E` (dark gray)
- **Text:** `#FFFFFF` (white), `#8E8E93` (light gray)
- **Accent:** `#34C759` (green), `#FF3B30` (red)

### **Typography**
- **Font Family:** Poppins
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Sizes:** Responsive scale from 12px to 48px

### **Spacing System**
- **Base Unit:** 8px
- **Scale:** 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Consistent:** All components use the 8px grid system

---

## 📱 **Mobile Optimization**

### **Touch Targets**
- **Minimum Size:** 44px × 44px for touch elements
- **Spacing:** 8px minimum between interactive elements
- **Feedback:** Visual feedback for all touch interactions

### **Responsive Design**
- **Breakpoints:** Mobile-first approach with progressive enhancement
- **Layout:** Flexible layouts that adapt to screen sizes
- **Navigation:** Touch-optimized navigation patterns

---

*This comprehensive component index provides detailed documentation of all React components in the DEX Mobile v6 application, enabling efficient development and maintenance of the user interface.*
