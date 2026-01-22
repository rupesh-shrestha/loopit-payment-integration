# Loopit Payment Method SDK - Laravel Integration Example

This project demonstrates how to integrate the Loopit Payment Method SDK into a Laravel 6.0 application.

## Quick Start

### 1. Copy SDK Files

Copy the SDK files to your Laravel public directory:

```bash
# From the loopit-payment-sdk dist folder
cp dist/loopit-payment-method.umd.js /path/to/laravel/public/js/
cp dist/loopit-payment-method.css /path/to/laravel/public/css/
```

### 2. Configure Environment

Add these variables to your `.env` file:

```env
LOOPIT_API_URL=https://api.loopit.io/api/portal
LOOPIT_WORKSPACE=your-workspace-slug
```

### 3. Include in Blade Template

```blade
@section('scripts')
<!-- Stripe.js (required) -->
<script src="https://js.stripe.com/v3/"></script>

<!-- Loopit Payment Method SDK -->
<link rel="stylesheet" href="/css/loopit-payment-method.css">
<script src="/js/loopit-payment-method.umd.js"></script>

<script>
LoopitPaymentMethod.mount('#loopit-payment-method', {
    apiBaseUrl: '{{ env("LOOPIT_API_URL") }}',
    workspace: '{{ env("LOOPIT_WORKSPACE") }}',
    ownerId: '{{ $owner->id }}',
    ownerType: '{{ $ownerType }}',  // 'person' or 'company'

    onPaymentMethodAdded: function(paymentMethod) {
        document.getElementById('payment_method_id').value = paymentMethod.id;
        document.getElementById('submit-btn').disabled = false;
    },

    onPaymentMethodRemoved: function() {
        document.getElementById('payment_method_id').value = '';
        document.getElementById('submit-btn').disabled = true;
    },

    onError: function(error) {
        alert('Error: ' + error.message);
    }
});
</script>
@endsection
```

## Example Files

| File | Description |
|------|-------------|
| `resources/views/integration/index.blade.php` | Full integration demo with documentation |
| `resources/views/integration/checkout.blade.php` | Realistic checkout page example |
| `resources/views/layouts/app.blade.php` | Base layout with styles |
| `routes/web.php` | Example routes |
| `public/js/loopit-payment-method.umd.js` | SDK JavaScript |
| `public/css/loopit-payment-method.css` | SDK Styles |

## SDK Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiBaseUrl` | string | Yes | Loopit API base URL |
| `workspace` | string | Yes | Your workspace slug |
| `ownerId` | string | Yes | Person or Company ID |
| `ownerType` | string | Yes | `'person'` or `'company'` |
| `onPaymentMethodAdded` | function | No | Called when card is added |
| `onPaymentMethodRemoved` | function | No | Called when card is removed |
| `onError` | function | No | Called on errors |

## Payment Method Object

When `onPaymentMethodAdded` is called, it receives a payment method object:

```javascript
{
    id: "pm_123abc",           // Payment method ID (use this for charges)
    brand: "visa",             // Card brand (visa, mastercard, amex)
    last_4: "4242",            // Last 4 digits
    expires: "12/2025"         // Expiration date
}
```

## Backend Usage

After the user adds a payment method, submit the form with the `payment_method_id`:

```php
// In your controller
public function processCheckout(Request $request)
{
    $paymentMethodId = $request->input('payment_method_id');

    // Use the payment_method_id to charge the customer
    // via the Loopit API or Stripe directly
}
```

## Requirements

- Laravel 6.0+
- Stripe.js (loaded from CDN)
- Valid Loopit API credentials
- Stripe card payment configuration in Loopit

## Support

For issues with the SDK, contact Loopit support.
