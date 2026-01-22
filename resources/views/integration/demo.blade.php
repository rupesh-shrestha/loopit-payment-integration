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
        <label class="payment-method-label">Payment method</label>
        <div id="loopit-payment-method"></div>
    </div>

    <div id="demo-result" class="demo-result">
        <div class="alert alert-success">
            <strong>Payment Method ID:</strong> <code id="result-payment-method-id"></code>
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
