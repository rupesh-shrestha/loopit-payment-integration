(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LoopitCheckout = {}));
})(this, (function (exports) { 'use strict';

    /**
     * Loopit Checkout API Client
     *
     * Handles API communication for the checkout SDK.
     * Does NOT require OTP verification - uses session/API key auth.
     */
    class CheckoutApiClient {
        constructor(config) {
            this.baseUrl = config.baseUrl.replace(/\/$/, '');
            this.workspace = config.workspace;
            this.apiKey = config.apiKey;
        }
        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            };
            // Add workspace header
            if (this.workspace) {
                headers['X-Workspace'] = this.workspace;
            }
            // Add API key if provided
            if (this.apiKey) {
                headers['X-API-Key'] = this.apiKey;
            }
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers,
                },
                credentials: 'include', // Include cookies for session auth
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.message || `API Error: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }
            return response.json();
        }
        // ============================================
        // Payment Method Endpoints
        // ============================================
        /**
         * Get available payment configurations (card only)
         */
        async getPaymentConfigs(currencyId) {
            const params = new URLSearchParams();
            if (currencyId) {
                params.set('currency_id', currencyId);
            }
            const queryString = params.toString();
            const configs = await this.request(`/payment/configs${queryString ? `?${queryString}` : ''}`);
            // Filter to only return card payment methods (no direct debit)
            return configs.filter((config) => config.payment_method_type.type.toLowerCase() === 'card');
        }
        /**
         * Get payment methods for an owner
         */
        async getPaymentMethods(ownerId, ownerType) {
            const params = new URLSearchParams({
                owner_id: ownerId,
                owner_type: ownerType,
            });
            return this.request(`/payment-methods?${params}`);
        }
        /**
         * Get default payment method for an owner
         */
        async getDefaultPaymentMethod(ownerId, ownerType) {
            const params = new URLSearchParams({
                owner_id: ownerId,
                owner_type: ownerType,
            });
            try {
                return await this.request(`/payment-methods/default?${params}`);
            }
            catch {
                return null;
            }
        }
        /**
         * Get setup config for adding a payment method (Stripe/Adyen)
         */
        async getSetupConfig(data) {
            return this.request('/payment-methods/setup-config', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        }
        /**
         * Add a payment method
         */
        async addPaymentMethod(data) {
            return this.request('/payment-methods/add', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        }
        // ============================================
        // Booking Endpoints
        // ============================================
        /**
         * Submit a booking with payment
         */
        async submitBooking(data) {
            return this.request('/checkout/submit', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        }
    }

    class StripeProvider {
        constructor() {
            this.stripe = null;
            this.elements = null;
            this.paymentElement = null;
            this.clientSecret = null;
            this.isInitialized = false;
        }
        async init(publishableKey, stripeAccount) {
            // Load Stripe.js if not already loaded
            if (!window.Stripe) {
                await this.loadStripeScript();
            }
            if (!window.Stripe) {
                throw new Error('Failed to load Stripe.js');
            }
            const options = stripeAccount ? { stripeAccount } : undefined;
            this.stripe = window.Stripe(publishableKey, options);
            this.isInitialized = true;
        }
        loadStripeScript() {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (window.Stripe) {
                    resolve();
                    return;
                }
                // Check if script is already being loaded
                const existingScript = document.querySelector('script[src*="js.stripe.com"]');
                if (existingScript) {
                    existingScript.addEventListener('load', () => resolve());
                    existingScript.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')));
                    return;
                }
                // Load the script
                const script = document.createElement('script');
                script.src = 'https://js.stripe.com/v3/';
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Stripe.js'));
                document.head.appendChild(script);
            });
        }
        setClientSecret(clientSecret) {
            this.clientSecret = clientSecret;
        }
        createPaymentElement(container, options) {
            if (!this.stripe) {
                throw new Error('Stripe not initialized. Call init() first.');
            }
            // Handle both string (currency only) and object (options) parameters
            let currency = 'aud';
            if (typeof options === 'string') {
                currency = options;
            }
            else if (options?.currency) {
                currency = options.currency;
            }
            // Store client secret if provided
            if (typeof options === 'object' && options?.clientSecret) {
                this.clientSecret = options.clientSecret;
            }
            // Create elements with setup mode - Card only (no direct debit)
            this.elements = this.stripe.elements({
                mode: 'setup',
                currency: currency.toLowerCase(),
                setupFutureUsage: 'off_session',
                paymentMethodTypes: ['card'], // Only allow card payments
                appearance: {
                    theme: 'flat',
                    labels: 'floating',
                    variables: {
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSizeBase: '16px',
                        spacingUnit: '4px',
                        borderRadius: '4px',
                    },
                },
            });
            // Create and mount payment element - Card only
            this.paymentElement = this.elements.create('payment', {
                layout: 'tabs',
                paymentMethodOrder: ['card'], // Only show card option
            });
            this.paymentElement.mount(container);
        }
        async confirmSetup() {
            if (!this.stripe || !this.elements || !this.clientSecret) {
                throw new Error('Stripe not properly initialized');
            }
            const result = await this.stripe.confirmSetup({
                elements: this.elements,
                clientSecret: this.clientSecret,
                redirect: 'if_required',
            });
            return result;
        }
        onReady(callback) {
            if (this.paymentElement) {
                this.paymentElement.on('ready', callback);
            }
        }
        onChange(callback) {
            if (this.paymentElement) {
                this.paymentElement.on('change', callback);
            }
        }
        cleanup() {
            if (this.paymentElement) {
                this.paymentElement.unmount();
                this.paymentElement.destroy();
                this.paymentElement = null;
            }
            this.elements = null;
            this.clientSecret = null;
        }
        isReady() {
            return this.isInitialized && this.stripe !== null;
        }
    }

    /**
     * Loopit Checkout SDK
     *
     * Main SDK class for checkout/booking flow.
     * Handles payment method management and booking submission.
     */
    class LoopitCheckoutSDK {
        constructor(config) {
            this.stripeProvider = null;
            this.config = config;
            this.container = this.getContainer(config.container);
            this.apiClient = new CheckoutApiClient({
                baseUrl: config.apiBaseUrl,
                workspace: config.workspace,
                apiKey: config.apiKey,
            });
            this.state = {
                paymentConfigs: [],
                paymentMethods: [],
                selectedPaymentMethod: null,
                selectedConfig: null,
                isLoading: true,
                error: null,
                view: 'payment-methods',
            };
        }
        getContainer(selector) {
            if (typeof selector === 'string') {
                const el = document.querySelector(selector);
                if (!el) {
                    throw new Error(`Container element not found: ${selector}`);
                }
                return el;
            }
            return selector;
        }
        /**
         * Initialize the SDK
         */
        async init() {
            try {
                this.render();
                // Load payment configs and existing payment methods in parallel
                const [configs, methods] = await Promise.all([
                    this.apiClient.getPaymentConfigs(),
                    this.apiClient.getPaymentMethods(this.config.ownerId, this.config.ownerType),
                ]);
                this.state.paymentConfigs = configs;
                this.state.paymentMethods = methods;
                this.state.isLoading = false;
                // Select first payment method if available
                if (methods.length > 0) {
                    this.state.selectedPaymentMethod = methods[0];
                }
                this.render();
                this.config.onReady?.();
            }
            catch (error) {
                this.state.isLoading = false;
                this.state.error = error instanceof Error ? error.message : 'Failed to initialize';
                this.render();
                this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
            }
        }
        /**
         * Get current selected payment method
         */
        getSelectedPaymentMethod() {
            return this.state.selectedPaymentMethod;
        }
        /**
         * Get all payment methods
         */
        getPaymentMethods() {
            return this.state.paymentMethods;
        }
        /**
         * Select a payment method
         */
        selectPaymentMethod(methodId) {
            const method = this.state.paymentMethods.find((m) => m.id === methodId);
            if (method) {
                this.state.selectedPaymentMethod = method;
                this.render();
            }
        }
        /**
         * Show add payment method form
         */
        showAddPaymentMethod() {
            this.state.view = 'add-payment-method';
            this.state.selectedConfig = this.state.paymentConfigs[0] || null;
            this.render();
            // Initialize payment provider after render
            if (this.state.selectedConfig) {
                this.initializePaymentProvider(this.state.selectedConfig);
            }
        }
        /**
         * Hide add payment method form and return to list
         */
        hideAddPaymentMethod() {
            this.state.view = 'payment-methods';
            this.state.selectedConfig = null;
            this.render();
        }
        /**
         * Select payment config for adding new method
         */
        async selectPaymentConfig(configId) {
            const config = this.state.paymentConfigs.find((c) => c.id === configId);
            if (config) {
                this.state.selectedConfig = config;
                this.render();
                await this.initializePaymentProvider(config);
            }
        }
        /**
         * Initialize the appropriate payment provider
         */
        async initializePaymentProvider(config) {
            const elementContainer = this.container.querySelector('.loopit-checkout-payment-element');
            if (!elementContainer)
                return;
            try {
                // Get setup config from API
                const setupConfig = await this.apiClient.getSetupConfig({
                    owner_id: this.config.ownerId,
                    owner_type: this.config.ownerType,
                    config_id: config.id,
                });
                // Only Stripe is supported
                if (setupConfig.provider === 'stripe' && config.stripe_config) {
                    if (!this.stripeProvider) {
                        this.stripeProvider = new StripeProvider();
                    }
                    await this.stripeProvider.init(config.stripe_config.publishable_key, config.stripe_config.stripe_account);
                    const stripeConfig = setupConfig.config;
                    this.stripeProvider.createPaymentElement(elementContainer, {
                        clientSecret: stripeConfig.setup_intent.client_secret,
                        currency: config.currency.code.toLowerCase(),
                    });
                }
                else {
                    throw new Error('Only Stripe payment provider is supported');
                }
            }
            catch (error) {
                this.state.error = error instanceof Error ? error.message : 'Failed to initialize payment';
                this.render();
                this.config.onPaymentMethodError?.(error instanceof Error ? error : new Error(String(error)));
            }
        }
        /**
         * Save the payment method
         */
        async savePaymentMethod(cardholderName) {
            if (!this.state.selectedConfig) {
                throw new Error('No payment config selected');
            }
            const config = this.state.selectedConfig;
            try {
                let externalPaymentMethodId = null;
                let additionalData = {};
                // Only Stripe is supported
                if (config.provider === 'stripe' && this.stripeProvider) {
                    const result = await this.stripeProvider.confirmSetup();
                    if (result.error) {
                        throw new Error(result.error.message);
                    }
                    externalPaymentMethodId = result.setupIntent?.payment_method;
                    if (cardholderName) {
                        additionalData = { cardholder_name: cardholderName };
                    }
                }
                else {
                    throw new Error('Only Stripe payment provider is supported');
                }
                const method = await this.apiClient.addPaymentMethod({
                    owner_id: this.config.ownerId,
                    owner_type: this.config.ownerType,
                    config_id: config.id,
                    external_payment_method_id: externalPaymentMethodId,
                    data: additionalData,
                });
                // Add to list and select
                this.state.paymentMethods.push(method);
                this.state.selectedPaymentMethod = method;
                this.state.view = 'payment-methods';
                this.render();
                this.config.onPaymentMethodAdded?.(method);
                return method;
            }
            catch (error) {
                this.config.onPaymentMethodError?.(error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        }
        /**
         * Submit a booking
         */
        async submitBooking(params) {
            try {
                const response = await this.apiClient.submitBooking({
                    booking_id: params.bookingId,
                    payment_method_id: this.state.selectedPaymentMethod?.id || null,
                    is_billing_address_same_as_residential: params.isBillingAddressSameAsResidential ?? false,
                    billing_address: params.billingAddress,
                    promo_code: params.promoCode ?? null,
                });
                this.config.onBookingSubmitted?.(response);
                return response;
            }
            catch (error) {
                this.config.onBookingError?.(error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
        }
        /**
         * Render the SDK UI
         */
        render() {
            const { isLoading, error, view } = this.state;
            if (isLoading) {
                this.container.innerHTML = `
        <div class="loopit-checkout" data-state="loading">
          <div class="loopit-checkout-loading">Loading...</div>
        </div>
      `;
                return;
            }
            if (error) {
                this.container.innerHTML = `
        <div class="loopit-checkout" data-state="error">
          <div class="loopit-checkout-error">${this.escapeHtml(error)}</div>
        </div>
      `;
                return;
            }
            if (view === 'add-payment-method') {
                this.renderAddPaymentMethod();
            }
            else {
                this.renderPaymentMethods();
            }
            this.attachEventListeners();
        }
        /**
         * Render payment methods list
         */
        renderPaymentMethods() {
            const { paymentMethods, selectedPaymentMethod } = this.state;
            this.container.innerHTML = `
      <div class="loopit-checkout" data-state="ready">
        <div class="loopit-checkout-payment-methods">
          <div class="loopit-checkout-payment-methods-header">Select Payment Method</div>

          ${paymentMethods.length > 0
            ? `
            <div class="loopit-checkout-payment-methods-list">
              ${paymentMethods
                .map((method) => `
                <div class="loopit-checkout-payment-method"
                     data-method-id="${method.id}"
                     data-selected="${selectedPaymentMethod?.id === method.id}">
                  <div class="loopit-checkout-payment-method-radio">
                    <input type="radio"
                           name="payment_method"
                           value="${method.id}"
                           ${selectedPaymentMethod?.id === method.id ? 'checked' : ''}>
                  </div>
                  <div class="loopit-checkout-payment-method-info">
                    <span class="loopit-checkout-payment-method-brand">${this.escapeHtml(method.brand)}</span>
                    <span class="loopit-checkout-payment-method-last4">****${this.escapeHtml(method.last_4)}</span>
                  </div>
                  <div class="loopit-checkout-payment-method-expiry">${this.escapeHtml(method.expires)}</div>
                </div>
              `)
                .join('')}
            </div>
          `
            : `
            <div class="loopit-checkout-no-payment-methods">
              No payment methods found. Add one below.
            </div>
          `}

          <button type="button" class="loopit-checkout-btn-add-method">
            + Add Payment Method
          </button>
        </div>
      </div>
    `;
        }
        /**
         * Render add payment method form
         */
        renderAddPaymentMethod() {
            const { paymentConfigs, selectedConfig } = this.state;
            this.container.innerHTML = `
      <div class="loopit-checkout" data-state="add-method">
        <div class="loopit-checkout-add-payment-method">
          <div class="loopit-checkout-add-method-header">
            <span class="loopit-checkout-add-method-title">Add Payment Method</span>
            <button type="button" class="loopit-checkout-btn-back">← Back</button>
          </div>

          ${paymentConfigs.length > 1
            ? `
            <div class="loopit-checkout-config-selector">
              ${paymentConfigs
                .map((config) => `
                <div class="loopit-checkout-config-option"
                     data-config-id="${config.id}"
                     data-selected="${selectedConfig?.id === config.id}">
                  <input type="radio"
                         name="payment_config"
                         value="${config.id}"
                         ${selectedConfig?.id === config.id ? 'checked' : ''}>
                  <span>${this.escapeHtml(config.payment_method_type.name)}</span>
                </div>
              `)
                .join('')}
            </div>
          `
            : ''}

          <div class="loopit-checkout-cardholder-name">
            <label class="loopit-checkout-label">Cardholder Name</label>
            <input type="text"
                   class="loopit-checkout-input loopit-checkout-cardholder-input"
                   placeholder="Name on card">
          </div>

          <div class="loopit-checkout-payment-element"></div>

          <button type="button" class="loopit-checkout-btn-save-method">
            Save Payment Method
          </button>
        </div>
      </div>
    `;
        }
        /**
         * Attach event listeners
         */
        attachEventListeners() {
            // Payment method selection
            this.container.querySelectorAll('.loopit-checkout-payment-method').forEach((el) => {
                el.addEventListener('click', () => {
                    const methodId = el.dataset.methodId;
                    if (methodId) {
                        this.selectPaymentMethod(methodId);
                    }
                });
            });
            // Add payment method button
            const addBtn = this.container.querySelector('.loopit-checkout-btn-add-method');
            addBtn?.addEventListener('click', () => {
                this.showAddPaymentMethod();
            });
            // Back button
            const backBtn = this.container.querySelector('.loopit-checkout-btn-back');
            backBtn?.addEventListener('click', () => {
                this.hideAddPaymentMethod();
            });
            // Payment config selection
            this.container.querySelectorAll('.loopit-checkout-config-option').forEach((el) => {
                el.addEventListener('click', () => {
                    const configId = el.dataset.configId;
                    if (configId) {
                        this.selectPaymentConfig(configId);
                    }
                });
            });
            // Save payment method button
            const saveBtn = this.container.querySelector('.loopit-checkout-btn-save-method');
            saveBtn?.addEventListener('click', async () => {
                const cardholderInput = this.container.querySelector('.loopit-checkout-cardholder-input');
                const cardholderName = cardholderInput?.value?.trim();
                try {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                    await this.savePaymentMethod(cardholderName);
                }
                catch {
                    // Error handled in savePaymentMethod
                }
                finally {
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Save Payment Method';
                    }
                }
            });
        }
        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
        /**
         * Destroy the SDK and clean up
         */
        destroy() {
            this.container.innerHTML = '';
            this.stripeProvider = null;
        }
    }

    /**
     * Loopit Checkout SDK
     *
     * A vanilla JavaScript SDK for integrating Loopit checkout functionality
     * into external websites (Laravel Blade, plain HTML, etc.)
     *
     * This SDK handles:
     * - Adding payment methods (Stripe/Adyen)
     * - Submitting bookings
     *
     * Unlike the Pay Invoice SDK, this does NOT require OTP verification.
     * Authentication is handled via session/cookies or API key.
     */
    // Export for UMD bundle
    const LoopitCheckout = {
        /**
         * Initialize the checkout SDK
         */
        init: async (config) => {
            const sdk = new LoopitCheckoutSDK(config);
            await sdk.init();
            return sdk;
        },
        /**
         * Create SDK instance without auto-initialization
         */
        create: (config) => {
            return new LoopitCheckoutSDK(config);
        },
    };

    exports.LoopitCheckout = LoopitCheckout;
    exports.LoopitCheckoutSDK = LoopitCheckoutSDK;
    exports.default = LoopitCheckout;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=loopit-checkout.js.map
