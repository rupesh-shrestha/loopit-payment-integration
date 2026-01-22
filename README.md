# Loopit Payment Method SDK - Laravel Integration Example

This project demonstrates how to integrate the Loopit Payment Method SDK into a Laravel application.

## Project Structure

| File | Description |
|------|-------------|
| `resources/views/integration/index.blade.php` | Integration guide with code examples |
| `resources/views/integration/demo.blade.php` | Live demo page |
| `resources/views/layouts/app.blade.php` | Base layout |
| `routes/web.php` | Routes (`/` for guide, `/demo` for demo) |
| `public/js/loopit-payment-method.umd.js` | SDK JavaScript |
| `public/css/loopit-payment-method.css` | SDK Styles |

## Running the Project

```bash
# Install dependencies
composer install

# Start the server
php artisan serve
```

Visit `http://localhost:8000` for the integration guide or `http://localhost:8000/demo` for the live demo.

## SDK Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiBaseUrl` | string | Yes | Loopit API base URL |
| `workspace` | string | Yes | Workspace slug |
| `microsite` | string | Yes | Microsite domain |
| `ownerId` | string | Yes | Person or Company UUID |
| `ownerType` | string | Yes | `'person'` or `'company'` |
| `onPaymentMethodAdded` | function | No | Called when card is added |
| `onPaymentMethodRemoved` | function | No | Called when card is removed |
| `onError` | function | No | Called on errors |

## Payment Method Object

When `onPaymentMethodAdded` is called, it receives:

```javascript
{
    id: "pm_123abc",           // Payment method ID
    brand: "visa",             // Card brand
    last_4: "4242",            // Last 4 digits
    cardholder_name: "John Doe",
    exp_month: 12,
    exp_year: 2025
}
```

## Backend Usage

Use the `payment_method_id` to create a payment via the Loopit API.

## Requirements

- Laravel 6.0+
- Stripe.js (loaded from CDN)
- Valid Loopit API credentials
