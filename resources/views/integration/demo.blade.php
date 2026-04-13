@extends('layouts.app')

@section('title', 'Loopit Payment Method SDK - Live Demo')

@section('styles')
<link rel="stylesheet" href="/css/demo.css">
@endsection

@section('content')
{{-- Header --}}
<div class="card">
    <div class="card-header">
        <h1 class="card-title">Live Demo</h1>
        <p class="card-description">Try the payment method SDK below</p>
    </div>

    {{-- Payment Method Type Selector --}}
    <div class="form-group">
        <label class="form-label">Payment Method Type</label>
        <div id="type-selector" style="display: flex; gap: 10px; margin-top: 4px;">
            <button type="button" class="type-btn" data-type="card"
                style="flex: 1; padding: 10px 16px; border-radius: 8px; border: 2px solid #D1D5DB; background: #F9FAFB; color: #374151; font-weight: 600; cursor: pointer; font-size: 14px;">
                💳 Card
            </button>
            <button type="button" class="type-btn" data-type="au_becs_debit"
                style="flex: 1; padding: 10px 16px; border-radius: 8px; border: 2px solid #D1D5DB; background: #F9FAFB; color: #374151; font-weight: 600; cursor: pointer; font-size: 14px;">
                🏦 AU BECS Direct Debit
            </button>
            <button type="button" class="type-btn" data-type="both"
                style="flex: 1; padding: 10px 16px; border-radius: 8px; border: 2px solid #D1D5DB; background: #F9FAFB; color: #374151; font-weight: 600; cursor: pointer; font-size: 14px;">
                💳🏦 Both
            </button>
        </div>
    </div>

    {{-- API Configuration --}}
    <div class="form-group">
        <label for="api_base_url" class="form-label">API Base URL</label>
        <input type="text" id="api_base_url" name="api_base_url" class="form-input" value="https://platform.api.loopit.co/api/portal">
    </div>

    <div class="form-group">
        <label for="workspace" class="form-label">Workspace</label>
        <input type="text" id="workspace" name="workspace" class="form-input" value="rupesh-us-demo">
    </div>

    <div class="form-group">
        <label for="microsite" class="form-label">Microsite</label>
        <input type="text" id="microsite" name="microsite" class="form-input" value="rupesh-us-demo.myloopit.com">
    </div>

    {{-- Owner Configuration --}}
    <div class="form-group">
        <label for="billing_owner_id" class="form-label">Billing Owner ID</label>
        <input type="text" id="billing_owner_id" name="billing_owner_id" class="form-input" value="a0c29b4e-3903-472c-aadb-05c4a7420103">
    </div>

    <div class="form-group">
        <label for="billing_owner_type" class="form-label">Billing Owner Type</label>
        <select id="billing_owner_type" name="billing_owner_type" class="form-input">
            <option value="person" selected>person</option>
            <option value="company">company</option>
        </select>
    </div>

    {{-- Load SDK Button --}}
    <button type="button" id="load-sdk-btn" class="btn btn-primary submit-btn-full">
        Load Payment Method SDK
    </button>

    {{-- Validation Errors --}}
    <div id="validation-errors" class="alert alert-warning demo-alert" style="display: none; margin-top: 16px;"></div>

    {{-- SDK Mount Point --}}
    <div class="payment-method-container" id="sdk-container" style="display: none;">
        <div id="detected-type-badge" style="display: none; margin-bottom: 12px;">
            <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Detected payment type:</span>
            <span id="detected-type-label" style="display: inline-block; margin-left: 6px; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;"></span>
        </div>
        <label class="payment-method-label">Payment method</label>
        <div id="loopit-payment-method"></div>
        <div style="margin-top: 12px;">
            <button type="button" id="reset-sdk-btn" class="btn" style="font-size: 13px; padding: 8px 16px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer;">
                &#8635; Reset &amp; try different config
            </button>
        </div>
    </div>

    <div id="demo-result" class="demo-result">
        <div class="alert alert-success">
            <strong>Payment Method ID:</strong> <code id="result-payment-method-id"></code><br>
            <strong>Type:</strong> <code id="result-payment-method-type"></code>
        </div>
    </div>
</div>

<div class="card">
    <a href="/" class="back-link">&larr; Back to Integration Guide</a>
</div>
@endsection

@section('scripts')
{{-- Stripe.js --}}
<script src="https://js.stripe.com/v3/"></script>

{{-- Loopit Payment Method SDK --}}
<link rel="stylesheet" href="/css/loopit-payment-method.css">
<script src="/js/loopit-payment-method.umd.js"></script>

{{-- Demo Page Script --}}
<script src="/js/demo.js"></script>
@endsection
