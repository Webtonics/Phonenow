# SMM Panel Implementation Guide

## 🎯 Complete Architecture Overview

This guide covers the full implementation of SMM (Social Media Marketing) services into TonicsTools.

---

## 📦 What We've Created

### Database Tables:
1. **smm_categories** - Instagram, TikTok, YouTube, etc.
2. **smm_services** - Individual services (followers, likes, views)
3. **smm_orders** - User orders with status tracking
4. **smm_provider_balances** - Track balance with each provider

### Backend Architecture:
1. **Models**: SmmCategory, SmmService, SmmOrder
2. **Interface**: SmmProviderInterface (contract for all providers)
3. **Abstract Class**: AbstractSmmProvider (shared functionality)
4. **Provider**: JapProvider (JustAnotherPanel implementation)

---

## 🚀 Implementation Steps

### Step 1: Configure Environment (.env)

```bash
# JustAnotherPanel
JAP_API_KEY=your_api_key_here
JAP_BASE_URL=https://justanotherpanel.com/api/v2
JAP_ENABLED=true

# Peakerr (backup provider)
PEAKERR_API_KEY=your_api_key_here
PEAKERR_BASE_URL=https://peakerr.com/api/v2
PEAKERR_ENABLED=true
```

### Step 2: Add to config/services.php

```php
'jap' => [
    'api_key' => env('JAP_API_KEY'),
    'base_url' => env('JAP_BASE_URL', 'https://justanotherpanel.com/api/v2'),
    'enabled' => env('JAP_ENABLED', false),
],

'peakerr' => [
    'api_key' => env('PEAKERR_API_KEY'),
    'base_url' => env('PEAKERR_BASE_URL', 'https://peakerr.com/api/v2'),
    'enabled' => env('PEAKERR_ENABLED', false),
],
```

### Step 3: Run Migration

```bash
/opt/alt/php84/usr/bin/php artisan migrate
```

### Step 4: Create SmmManager Service

This service will manage all SMM providers (similar to SmsProviderManager):

**backend/app/Services/SmmManager.php:**
- Aggregate services from all providers
- Apply pricing markup
- Handle order creation
- Track order status
- Sync services from providers

### Step 5: Create Artisan Commands

```bash
# Sync services from providers
php artisan smm:sync-services

# Update order statuses
php artisan smm:update-orders

# Check provider balances
php artisan smm:check-balances
```

### Step 6: Create API Controllers

**backend/app/Http/Controllers/Api/SmmController.php:**
- GET /api/smm/categories - List all categories
- GET /api/smm/services - List services (with filters)
- POST /api/smm/orders - Create new order
- GET /api/smm/orders - List user orders
- GET /api/smm/orders/{reference} - Get order details
- POST /api/smm/orders/{reference}/cancel - Cancel order
- POST /api/smm/orders/{reference}/refill - Request refill

### Step 7: Create Frontend Pages

**frontend/src/pages/dashboard/SmmPage.tsx:**
- Category selection (Instagram, TikTok, YouTube, etc.)
- Service browsing with filters
- Service details modal
- Order form
- Order history
- Order tracking

**frontend/src/services/smmService.ts:**
- API calls for SMM services
- Order creation
- Status tracking

---

## 💰 Pricing Strategy

### Markup Configuration:

```php
// In backend/app/Services/SmmManager.php

protected function calculateMarkup(float $cost): float
{
    // 50% markup by default
    $markup = config('smm.default_markup', 50);
    return round($cost * (1 + ($markup / 100)), 2);
}
```

### Example Pricing:

| Service | Provider Cost | Your Price | Profit |
|---------|--------------|------------|--------|
| 1000 IG Followers | $0.50 | ₦800 | ₦400 (50%) |
| 1000 TikTok Views | $0.10 | ₦200 | ₦100 (50%) |
| 1000 YouTube Views | $0.60 | ₦1000 | ₦500 (50%) |

---

## 🔄 Order Flow

1. **User selects service**
   - Browse categories
   - View service details (price, delivery time, min/max)

2. **User places order**
   - Enter social media link
   - Select quantity
   - Confirm payment (deduct from wallet)

3. **System processes order**
   - Deduct balance from user wallet
   - Send order to provider (JAP/Peakerr)
   - Store order in database with `processing` status

4. **Provider delivers**
   - Provider updates order status
   - System syncs status every 5 minutes
   - Update order: `processing` → `in_progress` → `completed`

5. **Order completed**
   - Mark order as `completed`
   - Notify user (optional: email/push notification)

---

## 🔧 Background Jobs

### 1. Sync Services (Daily)

```php
// backend/app/Console/Commands/SyncSmmServices.php
// Syncs latest services and prices from providers
// Schedule: php artisan schedule:run (every 24 hours)
```

### 2. Update Order Status (Every 5 minutes)

```php
// backend/app/Console/Commands/UpdateSmmOrders.php
// Checks status of all pending/processing orders
// Schedule: php artisan schedule:run (every 5 minutes)
```

### 3. Check Provider Balances (Hourly)

```php
// backend/app/Console/Commands/CheckSmmBalances.php
// Alerts if provider balance is low
// Schedule: php artisan schedule:run (every hour)
```

---

## 🎨 Frontend Design

### Categories Card Grid:
```
┌─────────────┬─────────────┬─────────────┐
│  Instagram  │   TikTok    │   YouTube   │
│     📷      │     🎵      │     📺      │
│  234 Services│  189 Services│  156 Services│
└─────────────┴─────────────┴─────────────┘
```

### Service Cards:
```
┌────────────────────────────────────────┐
│ Instagram Followers [High Quality]     │
│ ⭐⭐⭐⭐⭐ (4.8/5 - 1.2k orders)          │
│                                        │
│ ₦400 per 1000                          │
│ Min: 100 • Max: 100,000                │
│ ⚡ Delivery: 1-6 hours                  │
│ 🔄 Refill: 30 days                      │
│                                        │
│ [Order Now]                            │
└────────────────────────────────────────┘
```

### Order Form:
```
┌────────────────────────────────────────┐
│ Order Instagram Followers              │
│                                        │
│ Link: [https://instagram.com/username]│
│                                        │
│ Quantity: [1000] ▼                     │
│                                        │
│ Total: ₦400                            │
│ Balance: ₦5,000                        │
│                                        │
│ [Confirm Order]                        │
└────────────────────────────────────────┘
```

---

## 📊 Admin Features

### Service Management:
- Enable/disable services
- Adjust pricing markup
- Set minimum/maximum orders
- View service performance

### Order Management:
- View all orders
- Filter by status/user/service
- Manual refund/cancel
- Export reports

### Provider Management:
- View provider balances
- Sync services manually
- Configure API keys
- Enable/disable providers

---

## ✅ Testing Checklist

### Before Going Live:

1. **Deposit Funds**
   - Deposit $10-20 to JAP account
   - Test API connection
   - Verify balance retrieval

2. **Test Services**
   - Sync services from JAP
   - Verify service listing
   - Check pricing calculations

3. **Test Orders**
   - Create test order (cheap service)
   - Verify order creation
   - Check status updates
   - Verify completion

4. **Test Wallet Integration**
   - Verify balance deduction
   - Check transaction history
   - Test insufficient balance

5. **Test Error Handling**
   - Invalid link
   - Out of range quantity
   - Provider downtime

---

## 🚀 Launch Strategy

### Phase 1: Soft Launch (Week 1)
- Enable Instagram services only
- Limit to 10 beta users
- Monitor order success rate
- Gather feedback

### Phase 2: Expand (Week 2-3)
- Add TikTok, YouTube, Twitter
- Open to all users
- Add more services
- Optimize pricing

### Phase 3: Scale (Month 2)
- Add Peakerr as backup provider
- Implement bulk ordering
- Add reseller API access
- Marketing push

---

## 💡 Next Steps

1. **Complete remaining files:**
   - SmmManager service
   - SmmController
   - Artisan commands
   - Frontend pages

2. **Get API Keys:**
   - Sign up at JustAnotherPanel
   - Deposit funds ($20-50 to start)
   - Get API key
   - Test API connection

3. **Deploy:**
   - Run migrations
   - Sync services
   - Test ordering
   - Launch!

---

## 📞 Support

If you need help with:
- Creating remaining files
- Setting up providers
- Testing the integration
- Deploying to production

Just let me know which part you want to tackle next!
