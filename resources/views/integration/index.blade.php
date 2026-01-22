@extends('layouts.app')

@section('title', 'Loopit Payment Method SDK - Integration Guide')

@section('styles')
    <link rel="stylesheet" href="/css/demo.css">
@endsection

@section('content')
    {{-- Header --}}
    <div class="card">
        <div class="card-header">
            <h1 class="card-title">Loopit Payment Method SDK</h1>
            <p class="card-description">Vue.js SDK for managing payment methods in Laravel Blade templates</p>
        </div>

        <div class="alert alert-info">
            <strong>Features:</strong>
            <ul class="features-list">
                <li>Add a payment method (Stripe card only)</li>
                <li>Display selected payment method with brand image</li>
                <li>Remove payment method</li>
                <li>Returns <code>payment_method_id</code> for separate payment collection</li>
            </ul>
            <p class="features-note">
                <strong>Note:</strong> Only supports <strong>Stripe</strong> for <strong>card payments</strong>.
            </p>
        </div>

        <a href="/demo" class="btn btn-primary">View Live Demo &rarr;</a>
    </div>

    {{-- Integration Code --}}
    <div class="card">
        <div class="card-header">
            <h2 class="card-title card-title-sm">Integration Code</h2>
            <p class="card-description">Copy this code to integrate the SDK in your Laravel Blade template</p>
        </div>

        <h3 class="section-title">1. Include Scripts</h3>
        <pre class="code-block code-block-mb">&lt;!-- Stripe.js (required) --&gt;
&lt;script src="https://js.stripe.com/v3/"&gt;&lt;/script&gt;

&lt;!-- Loopit Payment Method SDK --&gt;
&lt;link rel="stylesheet" href="/css/loopit-payment-method.css"&gt;
&lt;script src="/js/loopit-payment-method.umd.js"&gt;&lt;/script&gt;</pre>

        <h3 class="section-title">2. HTML Structure</h3>
        <pre class="code-block code-block-mb">&lt;!-- SDK mount point --&gt;
&lt;div id="loopit-payment-method"&gt;&lt;/div&gt;

&lt;!-- Your form with hidden payment_method_id field --&gt;
&lt;form id="checkout-form"&gt;
    &lt;input type="hidden" name="payment_method_id" id="payment_method_id"&gt;
    &lt;!-- billing address fields --&gt;
    &lt;button type="submit" id="submit-btn" disabled&gt;Complete Booking&lt;/button&gt;
&lt;/form&gt;</pre>

        <h3 class="section-title">3. Initialize SDK</h3>
        <pre class="code-block">&lt;script&gt;
LoopitPaymentMethod.mount('#loopit-payment-method', {
    // Required: API configuration
    apiBaseUrl: 'https://platform.api.loopit.co/api/portal',
    workspace: 'your-workspace-slug',
    microsite: 'your-microsite.myloopit.com',

    // Required: Owner information (person or company)
    ownerId: 'uuid-of-person-or-company',
    ownerType: 'person', // or 'company'

    // Callbacks
    onPaymentMethodAdded: function(paymentMethod) {
        console.log('Payment method added:', paymentMethod);
        document.getElementById('payment_method_id').value = paymentMethod.id;
        document.getElementById('submit-btn').disabled = false;
    },

    onPaymentMethodRemoved: function() {
        console.log('Payment method removed');
        document.getElementById('payment_method_id').value = '';
        document.getElementById('submit-btn').disabled = true;
    },

    onError: function(error) {
        console.error('SDK Error:', error);
        alert('Error: ' + error.message);
    }
});
&lt;/script&gt;</pre>
    </div>

    {{-- Configuration Options --}}
    <div class="card">
        <div class="card-header">
            <h2 class="card-title config-title">Configuration Options</h2>
        </div>

        <table class="endpoints-table">
            <thead>
            <tr>
                <th>Option</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td><code>apiBaseUrl</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>Loopit API base URL (e.g., https://platform.api.loopit.co/api/portal)</td>
            </tr>
            <tr>
                <td><code>workspace</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>Workspace slug identifier</td>
            </tr>
            <tr>
                <td><code>microsite</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>Microsite domain (e.g., your-workspace.myloopit.com)</td>
            </tr>
            <tr>
                <td><code>ownerId</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>UUID of the person or company</td>
            </tr>
            <tr>
                <td><code>ownerType</code></td>
                <td>string</td>
                <td>Yes</td>
                <td>'person' or 'company'</td>
            </tr>
            <tr>
                <td><code>onPaymentMethodAdded</code></td>
                <td>function</td>
                <td>No</td>
                <td>Callback when payment method is added</td>
            </tr>
            <tr>
                <td><code>onPaymentMethodRemoved</code></td>
                <td>function</td>
                <td>No</td>
                <td>Callback when payment method is removed</td>
            </tr>
            <tr>
                <td><code>onError</code></td>
                <td>function</td>
                <td>No</td>
                <td>Callback when an error occurs</td>
            </tr>
            </tbody>
        </table>
    </div>

    {{-- SDK Files --}}
    <div class="card">
        <div class="card-header">
            <h2 class="card-title config-title">SDK Files</h2>
        </div>

        <ul class="sdk-files-list">
            <li><code>/public/js/loopit-payment-method.umd.js</code> - SDK JavaScript</li>
            <li><code>/public/css/loopit-payment-method.css</code> - SDK Styles</li>
        </ul>

        <h3 class="section-title section-title-mt">API Endpoints Used</h3>
        <table class="endpoints-table">
            <thead>
            <tr>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Description</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td><code>/payment/config</code></td>
                <td>GET</td>
                <td>Get Stripe publishable key and gateway config</td>
            </tr>
            <tr>
                <td><code>/payment-methods/setup-config</code></td>
                <td>POST</td>
                <td>Get Stripe SetupIntent client_secret</td>
            </tr>
            <tr>
                <td><code>/payment-methods/add</code></td>
                <td>POST</td>
                <td>Save payment method to Loopit API</td>
            </tr>
            </tbody>
        </table>
    </div>

    {{-- Payment Method Object --}}
    <div class="card">
        <div class="card-header">
            <h2 class="card-title config-title">Payment Method Object</h2>
            <p class="card-description">The object returned in <code>onPaymentMethodAdded</code> callback</p>
        </div>

        <pre class="code-block">{
    id: "pm_123456789",      // Payment method ID to create payment via Loopit API
    brand: "visa",           // Card brand (visa, mastercard, amex, etc.)
    last_4: "4242",          // Last 4 digits of card
    cardholder_name: "John Doe",
    exp_month: 12,
    exp_year: 2025
}</pre>
    </div>

    {{-- Backend Usage --}}
    <div class="card">
        <div class="card-header">
            <h2 class="card-title config-title">Backend Usage</h2>
            <p class="card-description">Use the <code>payment_method_id</code> to create a payment via the Loopit API</p>
        </div>

        <pre class="code-block">// In your controller
public function processCheckout(Request $request)
{
    $paymentMethodId = $request->input('payment_method_id');

    // Use the payment_method_id to create a payment via Loopit API
}</pre>
    </div>
@endsection
