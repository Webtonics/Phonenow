# eSIM Integration - Admin-Controlled Configuration

## Overview
The eSIM integration is now fully integrated with your existing admin settings system. All pricing and configuration can be managed through the admin panel without touching code.

---

## Configuration Architecture

### 1. **Database-Driven Settings** (Admin Controlled)

All eSIM settings are stored in the `settings` table and can be managed via admin panel:

#### Pricing Settings (Group: `pricing`)
| Setting Key | Default | Description |
|------------|---------|-------------|
| `esim_profile_markup` | 100 | Markup % for eSIM profiles (100 = 2x wholesale) |
| `esim_data_markup` | 150 | Markup % for data bundles (150 = 2.5x wholesale) |

#### eSIM Configuration (Group: `esim`)
| Setting Key | Default | Description |
|------------|---------|-------------|
| `esim_auto_sync` | true | Auto-sync packages from API daily |
| `esim_sync_frequency_hours` | 24 | Sync frequency in hours |
| `esim_low_data_threshold` | 20 | Low data warning at X% remaining |
| `esim_expiry_warning_days` | 3 | Expiry warning X days before |
| `esim_enable_usage_notifications` | true | Enable low data/expiry emails |
| `esim_min_purchase_amount` | 1000 | Minimum purchase in NGN |
| `esim_max_profiles_per_user` | 10 | Max active eSIMs per user (0=unlimited) |

---

### 2. **Live Currency Integration**

eSIM pricing automatically uses your existing `ExchangeRateService`:

```php
// Pricing flow:
$wholesalePriceUsd = 5.00; // From eSIM Access API
$exchangeRate = $exchangeRateService->getUsdToNgnRate(); // Live rate (~₦1,600)
$wholesaleNgn = $wholesalePriceUsd * $exchangeRate; // ₦8,000
$markup = Setting::getEsimProfileMarkup(); // 100%
$sellingPrice = $wholesaleNgn * (1 + $markup/100); // ₦16,000
$profit = $sellingPrice - $wholesaleNgn; // ₦8,000
```

**Exchange Rate Features:**
- Fetches live USD→NGN rate from exchangerate-api.com
- Falls back to CBN API if primary fails
- Caches for 1 hour
- Defaults to ₦1,600 if all APIs fail
- Updates automatically every hour

---

### 3. **API Credentials** (Environment Variables)

Only sensitive API credentials remain in `.env`:

```env
# eSIM Access API Credentials (Get from: https://esimaccess.com)
ESIM_API_URL=https://api.esimaccess.com/api/v1
ESIM_ACCESS_CODE=your_access_code_here
ESIM_SECRET_KEY=your_secret_key_here

# API Timeouts (Optional)
ESIM_API_TIMEOUT=30
ESIM_API_RETRY_TIMES=3
```

---

## Admin Panel Integration

### Settings Management Endpoints

```php
// Get all eSIM settings
GET /api/admin/settings?group=esim
GET /api/admin/settings?group=pricing

// Update individual settings
PUT /api/admin/settings
{
    "esim_profile_markup": 120,
    "esim_data_markup": 180,
    "esim_low_data_threshold": 15
}

// Get pricing preview
GET /api/admin/esim/pricing-calculator?wholesale_usd=5.00&type=profile
Response:
{
    "wholesale_usd": 5.00,
    "wholesale_ngn": 8000.00,
    "selling_ngn": 16000.00,
    "markup_percentage": 100,
    "profit": 8000.00,
    "exchange_rate": 1600.00
}
```

---

## Usage in Code

### Getting Settings

```php
use App\Models\Setting;

// Get markups
$profileMarkup = Setting::getEsimProfileMarkup(); // 100
$dataMarkup = Setting::getEsimDataMarkup(); // 150

// Get notification settings
$lowDataThreshold = Setting::getEsimLowDataThreshold(); // 20
$expiryWarningDays = Setting::getEsimExpiryWarningDays(); // 3
$autoSync = Setting::isEsimAutoSyncEnabled(); // true
```

### Calculating Prices

```php
use App\Services\ESIMPricingService;

$pricingService = app(ESIMPricingService::class);

// Calculate profile price
$pricing = $pricingService->calculateProfilePrice(5.00); // $5 USD
// Returns:
// [
//     'wholesale_usd' => 5.00,
//     'wholesale_ngn' => 8000.00,
//     'selling_ngn' => 16000.00,
//     'markup_percentage' => 100,
//     'profit' => 8000.00,
//     'exchange_rate' => 1600.00
// ]

// Calculate data bundle price
$pricing = $pricingService->calculateDataBundlePrice(20.00); // $20 USD
// Returns selling price with 150% markup
```

### Updating Settings (Admin Only)

```php
use App\Services\ESIMPricingService;

$pricingService = app(ESIMPricingService::class);

// Update markups
$pricingService->updateProfileMarkup(120); // 120% = 2.2x
$pricingService->updateDataMarkup(180); // 180% = 2.8x

// Update other settings
Setting::setValue('esim_low_data_threshold', 15, 'integer', 'esim');
Setting::setValue('esim_auto_sync', false, 'boolean', 'esim');
```

---

## Database Seeding

Initialize all eSIM settings:

```bash
php artisan db:seed --class=ESIMSettingsSeeder
```

This creates all default eSIM settings in the database.

---

## Frontend Integration

### Settings API Response

```json
GET /api/admin/settings?group=esim
{
    "success": true,
    "data": {
        "esim_auto_sync": true,
        "esim_sync_frequency_hours": 24,
        "esim_low_data_threshold": 20,
        "esim_expiry_warning_days": 3,
        "esim_enable_usage_notifications": true,
        "esim_min_purchase_amount": 1000,
        "esim_max_profiles_per_user": 10
    }
}

GET /api/admin/settings?group=pricing
{
    "success": true,
    "data": {
        "phone_markup_percentage": 1000,
        "smm_markup_percentage": 500,
        "esim_profile_markup": 100,
        "esim_data_markup": 150
    }
}
```

### React Admin Settings Page

```tsx
// Pricing Settings Component
const ESIMPricingSettings = () => {
  const [profileMarkup, setProfileMarkup] = useState(100);
  const [dataMarkup, setDataMarkup] = useState(150);

  const handleSave = async () => {
    await api.put('/admin/settings', {
      esim_profile_markup: profileMarkup,
      esim_data_markup: dataMarkup
    });
  };

  return (
    <div className="card">
      <h3>eSIM Pricing</h3>
      <div>
        <label>Profile Markup (%)</label>
        <input
          type="number"
          value={profileMarkup}
          onChange={(e) => setProfileMarkup(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          100% = 2x wholesale price
        </p>
      </div>

      <div>
        <label>Data Bundle Markup (%)</label>
        <input
          type="number"
          value={dataMarkup}
          onChange={(e) => setDataMarkup(e.target.value)}
        />
        <p className="text-sm text-gray-500">
          150% = 2.5x wholesale price
        </p>
      </div>

      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
};
```

---

## Benefits of This Architecture

✅ **No Code Changes for Pricing** - Admin can adjust markups anytime
✅ **Live Currency Rates** - Prices update automatically with exchange rates
✅ **Centralized Settings** - Same system as phone numbers and SMM services
✅ **Cached Performance** - Settings cached for 1 hour
✅ **Audit Trail** - All settings changes tracked with timestamps
✅ **Flexible Markup** - Different markups for profiles vs data bundles
✅ **Admin Control** - Everything manageable from admin dashboard

---

## Files Created/Modified

### New Files:
- `app/Services/ESIMPricingService.php` - Pricing calculations with live rates
- `database/seeders/ESIMSettingsSeeder.php` - Initialize default settings

### Modified Files:
- `app/Models/Setting.php` - Added eSIM helper methods
- `config/esim.php` - Removed hardcoded pricing, now admin-controlled

### Integration Points:
- Uses existing `ExchangeRateService` for USD→NGN conversion
- Uses existing `Setting` model for configuration
- Uses existing settings table (no new migrations needed)

---

## Next Steps

1. ✅ **Configuration Complete** - Settings system integrated
2. ⏳ **Build API Service** - ESIMAccessService with authentication
3. ⏳ **Package Management** - Sync packages with dynamic pricing
4. ⏳ **Purchase Flow** - Buy eSIMs with live pricing
5. ⏳ **Admin Dashboard** - Settings UI for markup management

---

Ready to proceed with Phase 2: API Integration! 🚀
