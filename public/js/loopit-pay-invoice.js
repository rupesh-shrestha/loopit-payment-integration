(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LoopitPayInvoice = {}));
})(this, (function (exports) { 'use strict';

    class ApiClient {
        constructor(config) {
            this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
            this.verificationToken = config.verificationToken;
            this.workspace = config.workspace;
        }
        /**
         * Update authentication token
         */
        setAuth(verificationToken) {
            this.verificationToken = verificationToken;
        }
        async request(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };
            // Add authentication headers
            if (this.verificationToken) {
                headers['Authorization'] = `Bearer ${this.verificationToken}`;
            }
            if (this.workspace) {
                headers['X-Workspace'] = this.workspace;
            }
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers,
                },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.message || `API Error: ${response.status} ${response.statusText}`;
                throw new Error(message);
            }
            return response.json();
        }
        /**
         * Build auth query params for GET requests
         */
        buildAuthParams(params) {
            if (this.verificationToken) {
                params.set('verification_token', this.verificationToken);
            }
        }
        // Invoice endpoints
        async getInvoice(invoiceId) {
            return this.request(`/invoices/${invoiceId}`);
        }
        async getInvoicePdf(invoiceId) {
            return this.request(`/invoices/${invoiceId}/pdf`);
        }
        async payInvoice(data) {
            // Add auth token to request body
            const requestData = {
                ...data,
                verification_token: data.verification_token || this.verificationToken,
            };
            return this.request('/invoices/pay', {
                method: 'POST',
                body: JSON.stringify(requestData),
            });
        }
        // Payment method endpoints
        async getPaymentMethods(ownerId, ownerType) {
            const params = new URLSearchParams({
                owner_id: ownerId,
                owner_type: ownerType,
            });
            this.buildAuthParams(params);
            return this.request(`/payment-methods?${params}`);
        }
        async getDefaultPaymentMethod(ownerId, ownerType) {
            const params = new URLSearchParams({
                owner_id: ownerId,
                owner_type: ownerType,
            });
            this.buildAuthParams(params);
            try {
                return await this.request(`/payment-methods/default?${params}`);
            }
            catch {
                return null;
            }
        }
        async getPaymentConfigs(currencyId) {
            const params = new URLSearchParams();
            if (currencyId) {
                params.set('currency_id', currencyId);
            }
            this.buildAuthParams(params);
            const queryString = params.toString();
            const configs = await this.request(`/payment/configs${queryString ? `?${queryString}` : ''}`);
            // Filter to only return card payment methods (no direct debit)
            return configs.filter((config) => config.payment_method_type.type.toLowerCase() === 'card');
        }
        async addPaymentMethod(data) {
            // Add auth token to request body
            const requestData = {
                ...data,
                verification_token: this.verificationToken,
            };
            return this.request('/payment-methods/add', {
                method: 'POST',
                body: JSON.stringify(requestData),
            });
        }
        async getSetupConfig(data) {
            // Add auth token to request body
            const requestData = {
                ...data,
                verification_token: this.verificationToken,
            };
            return this.request('/payment-methods/setup-config', {
                method: 'POST',
                body: JSON.stringify(requestData),
            });
        }
    }

    /**
     * Currency formatting utilities
     */
    const defaultOptions = {
        symbol: '$',
        locale: 'en-US',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    function formatCurrency(amount, options = {}) {
        const opts = { ...defaultOptions, ...options };
        const formatted = new Intl.NumberFormat(opts.locale, {
            minimumFractionDigits: opts.minimumFractionDigits,
            maximumFractionDigits: opts.maximumFractionDigits,
        }).format(amount);
        return `${opts.symbol}${formatted}`;
    }
    function formatPercentage(rate) {
        return `${(rate * 100).toFixed(2)}%`;
    }
    function calculateSurcharge(amount, surchargeRate) {
        return amount * surchargeRate;
    }
    function calculateTotalWithSurcharge(amount, surchargeRate) {
        return amount * (1 + surchargeRate);
    }

    /**
     * DOM manipulation utilities
     */
    function getContainer(selector) {
        if (typeof selector === 'string') {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Container element not found: ${selector}`);
            }
            return element;
        }
        return selector;
    }
    function setVisible(element, visible) {
        element.setAttribute('data-visible', visible.toString());
        element.style.display = visible ? '' : 'none';
    }
    function setSelected(element, selected) {
        element.setAttribute('data-selected', selected.toString());
    }
    function setState(element, state) {
        element.setAttribute('data-state', state);
    }
    function clearChildren(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    class InvoiceDisplay {
        constructor(options) {
            this.options = options;
        }
        render(invoice) {
            const container = document.createElement('div');
            container.className = 'loopit-invoice';
            container.setAttribute('data-invoice-id', invoice.id);
            container.innerHTML = `
      <div class="loopit-invoice-header">
        <span class="loopit-invoice-number" data-field="number">${escapeHtml(invoice.number)}</span>
        <span class="loopit-invoice-status" data-field="payment_status" data-status="${escapeHtml(invoice.payment_status.toLowerCase())}">
          ${escapeHtml(invoice.payment_status)}
        </span>
      </div>
      <div class="loopit-invoice-amount" data-field="outstanding_balance">
        ${formatCurrency(invoice.outstanding_balance, { symbol: this.options.currencySymbol })}
      </div>
      <div class="loopit-invoice-details">
        <div class="loopit-invoice-due" data-field="due_date">
          <span class="loopit-label">Due Date:</span>
          <span class="loopit-value">${escapeHtml(this.formatDate(invoice.due_date, invoice.timezone))}</span>
        </div>
        <div class="loopit-invoice-issued" data-field="issued_at">
          <span class="loopit-label">Issued:</span>
          <span class="loopit-value">${escapeHtml(this.formatDate(invoice.issued_at, invoice.timezone))}</span>
        </div>
      </div>
      <button class="loopit-btn loopit-btn-download" data-action="download-pdf" type="button">
        Download PDF
      </button>
    `;
            // Attach event listener
            const downloadBtn = container.querySelector('[data-action="download-pdf"]');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.options.onDownloadPdf();
                });
            }
            return container;
        }
        formatDate(dateString, timezone) {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: timezone || undefined,
                });
            }
            catch {
                return dateString;
            }
        }
    }

    class PaymentMethodSelector {
        constructor(options) {
            this.options = options;
        }
        render(paymentMethods, selectedId) {
            const container = document.createElement('div');
            container.className = 'loopit-payment-methods';
            if (paymentMethods.length === 0) {
                container.innerHTML = `
        <div class="loopit-payment-methods-empty">
          <p>No payment methods available</p>
        </div>
      `;
            }
            else {
                const methodsList = document.createElement('div');
                methodsList.className = 'loopit-payment-methods-list';
                paymentMethods.forEach((method) => {
                    const methodElement = this.renderPaymentMethod(method, method.id === selectedId);
                    methodsList.appendChild(methodElement);
                });
                container.appendChild(methodsList);
            }
            // Add new payment method button
            const addButton = document.createElement('button');
            addButton.className = 'loopit-btn loopit-btn-add-method';
            addButton.type = 'button';
            addButton.textContent = paymentMethods.length > 0 ? 'Add Payment Method' : 'Add Payment Method';
            addButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.options.onAddNew();
            });
            container.appendChild(addButton);
            return container;
        }
        renderPaymentMethod(method, isSelected) {
            const element = document.createElement('div');
            element.className = 'loopit-payment-method';
            element.setAttribute('data-payment-method-id', method.id);
            element.setAttribute('data-type', method.type);
            setSelected(element, isSelected);
            const brandDisplay = this.getBrandDisplay(method);
            const last4Display = method.last_4 ? `****${escapeHtml(method.last_4)}` : '';
            const expiresDisplay = method.expires ? escapeHtml(method.expires) : '';
            element.innerHTML = `
      <div class="loopit-payment-method-radio">
        <input
          type="radio"
          name="payment_method"
          value="${escapeHtml(method.id)}"
          ${isSelected ? 'checked' : ''}
          class="loopit-radio"
        />
      </div>
      <div class="loopit-payment-method-info">
        <span class="loopit-payment-method-brand">${brandDisplay}</span>
        <span class="loopit-payment-method-last4">${last4Display}</span>
        ${expiresDisplay ? `<span class="loopit-payment-method-expiry">Exp: ${expiresDisplay}</span>` : ''}
      </div>
      ${method.is_default ? '<span class="loopit-payment-method-default">Default</span>' : ''}
    `;
            // Click handler
            element.addEventListener('click', () => {
                this.options.onSelect(method.id);
            });
            // Radio change handler
            const radio = element.querySelector('input[type="radio"]');
            if (radio) {
                radio.addEventListener('change', () => {
                    this.options.onSelect(method.id);
                });
            }
            return element;
        }
        getBrandDisplay(method) {
            // Only card payments are supported
            if (method.brand) {
                // Capitalize brand name
                return method.brand.charAt(0).toUpperCase() + method.brand.slice(1);
            }
            return 'Card';
        }
    }

    /**
     * Form validation utilities
     */
    function validateAmount(amount, maxAmount, minAmount = 0.01) {
        if (isNaN(amount)) {
            return { valid: false, message: 'Please enter a valid amount' };
        }
        if (amount < minAmount) {
            return { valid: false, message: `Amount must be at least ${minAmount}` };
        }
        if (amount > maxAmount) {
            return { valid: false, message: `Amount cannot exceed ${maxAmount}` };
        }
        return { valid: true };
    }

    class PaymentForm {
        constructor(options) {
            this.amountInput = null;
            this.surchargeElement = null;
            this.totalElement = null;
            this.submitButton = null;
            this.errorElement = null;
            this.options = options;
        }
        render(amount, maxAmount, surchargeRate, hasPaymentMethod) {
            const container = document.createElement('div');
            container.className = 'loopit-payment-form';
            const surcharge = calculateSurcharge(amount, surchargeRate);
            const total = calculateTotalWithSurcharge(amount, surchargeRate);
            const hasSurcharge = surchargeRate > 0;
            container.innerHTML = `
      <div class="loopit-form-group loopit-amount-input">
        <label for="loopit-amount" class="loopit-label">Amount to Pay</label>
        <div class="loopit-input-wrapper">
          <span class="loopit-input-prefix">${this.options.currencySymbol}</span>
          <input
            type="number"
            id="loopit-amount"
            class="loopit-input"
            value="${amount.toFixed(2)}"
            min="0.01"
            max="${maxAmount}"
            step="0.01"
          />
        </div>
        <div class="loopit-input-hint">
          Maximum: ${formatCurrency(maxAmount, { symbol: this.options.currencySymbol })}
        </div>
        <div class="loopit-form-error" data-visible="false"></div>
      </div>

      ${hasSurcharge ? `
        <div class="loopit-surcharge" data-visible="true">
          <div class="loopit-surcharge-row">
            <span class="loopit-label">Surcharge (${formatPercentage(surchargeRate)}):</span>
            <span class="loopit-surcharge-amount">${formatCurrency(surcharge, { symbol: this.options.currencySymbol })}</span>
          </div>
        </div>
      ` : ''}

      <div class="loopit-total">
        <span class="loopit-label">Total:</span>
        <span class="loopit-total-amount">${formatCurrency(total, { symbol: this.options.currencySymbol })}</span>
      </div>

      <button
        type="button"
        class="loopit-btn loopit-btn-pay"
        ${!hasPaymentMethod ? 'disabled' : ''}
      >
        Pay ${formatCurrency(total, { symbol: this.options.currencySymbol })}
      </button>
    `;
            // Get references
            this.amountInput = container.querySelector('#loopit-amount');
            this.surchargeElement = container.querySelector('.loopit-surcharge-amount');
            this.totalElement = container.querySelector('.loopit-total-amount');
            this.submitButton = container.querySelector('.loopit-btn-pay');
            this.errorElement = container.querySelector('.loopit-form-error');
            // Attach event listeners
            if (this.amountInput) {
                this.amountInput.addEventListener('input', () => {
                    this.handleAmountInput(maxAmount, surchargeRate);
                });
                this.amountInput.addEventListener('blur', () => {
                    this.handleAmountBlur(maxAmount, surchargeRate);
                });
            }
            if (this.submitButton) {
                this.submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSubmit(maxAmount);
                });
            }
            return container;
        }
        handleAmountInput(_maxAmount, surchargeRate) {
            if (!this.amountInput)
                return;
            const value = parseFloat(this.amountInput.value) || 0;
            this.options.onAmountChange(value);
            this.updateCalculations(value, surchargeRate);
            this.hideError();
        }
        handleAmountBlur(maxAmount, surchargeRate) {
            if (!this.amountInput)
                return;
            let value = parseFloat(this.amountInput.value) || 0;
            // Clamp value
            if (value < 0)
                value = 0;
            if (value > maxAmount)
                value = maxAmount;
            this.amountInput.value = value.toFixed(2);
            this.options.onAmountChange(value);
            this.updateCalculations(value, surchargeRate);
        }
        updateCalculations(amount, surchargeRate) {
            const surcharge = calculateSurcharge(amount, surchargeRate);
            const total = calculateTotalWithSurcharge(amount, surchargeRate);
            if (this.surchargeElement) {
                this.surchargeElement.textContent = formatCurrency(surcharge, {
                    symbol: this.options.currencySymbol,
                });
            }
            if (this.totalElement) {
                this.totalElement.textContent = formatCurrency(total, {
                    symbol: this.options.currencySymbol,
                });
            }
            if (this.submitButton) {
                this.submitButton.textContent = `Pay ${formatCurrency(total, { symbol: this.options.currencySymbol })}`;
            }
        }
        handleSubmit(maxAmount) {
            if (!this.amountInput)
                return;
            const amount = parseFloat(this.amountInput.value) || 0;
            const validation = validateAmount(amount, maxAmount);
            if (!validation.valid) {
                this.showError(validation.message || 'Invalid amount');
                return;
            }
            this.options.onSubmit(amount);
        }
        showError(message) {
            if (this.errorElement) {
                this.errorElement.textContent = message;
                this.errorElement.setAttribute('data-visible', 'true');
                this.errorElement.style.display = '';
            }
        }
        hideError() {
            if (this.errorElement) {
                this.errorElement.setAttribute('data-visible', 'false');
                this.errorElement.style.display = 'none';
            }
        }
        setLoading(loading) {
            if (this.submitButton) {
                this.submitButton.disabled = loading;
                this.submitButton.textContent = loading ? 'Processing...' : this.submitButton.textContent;
            }
        }
    }

    class AddPaymentMethod {
        constructor(options) {
            this.container = null;
            this.stripeElementContainer = null;
            this.configSelect = null;
            this.saveButton = null;
            this.cancelButton = null;
            this.loadingElement = null;
            this.errorElement = null;
            this.currentConfigId = null;
            this.currentSetupConfig = null;
            this.ownerId = '';
            this.ownerType = '';
            this.options = options;
        }
        async render(ownerId, ownerType, paymentConfigs) {
            this.ownerId = ownerId;
            this.ownerType = ownerType;
            this.container = document.createElement('div');
            this.container.className = 'loopit-add-payment-method';
            // Filter to only show card configs (Stripe)
            const cardConfigs = paymentConfigs.filter((c) => c.payment_method_type.type === 'card' && c.gateway.provider === 'stripe');
            this.container.innerHTML = `
      <div class="loopit-add-payment-method-header">
        <h3 class="loopit-title">Add Payment Method</h3>
      </div>

      ${cardConfigs.length > 1 ? `
        <div class="loopit-form-group">
          <label for="loopit-config-select" class="loopit-label">Payment Type</label>
          <select id="loopit-config-select" class="loopit-select">
            ${cardConfigs.map((c) => `
              <option value="${c.id}">${c.payment_method_type.name}</option>
            `).join('')}
          </select>
        </div>
      ` : ''}

      <div class="loopit-stripe-element-container">
        <div class="loopit-stripe-element"></div>
      </div>

      <div class="loopit-add-payment-method-loading" data-visible="false">
        Loading payment form...
      </div>

      <div class="loopit-add-payment-method-error" data-visible="false"></div>

      <div class="loopit-add-payment-method-actions">
        <button type="button" class="loopit-btn loopit-btn-save-method" disabled>
          Save Payment Method
        </button>
        <button type="button" class="loopit-btn loopit-btn-cancel">
          Cancel
        </button>
      </div>
    `;
            // Get references
            this.stripeElementContainer = this.container.querySelector('.loopit-stripe-element');
            this.configSelect = this.container.querySelector('#loopit-config-select');
            this.saveButton = this.container.querySelector('.loopit-btn-save-method');
            this.cancelButton = this.container.querySelector('.loopit-btn-cancel');
            this.loadingElement = this.container.querySelector('.loopit-add-payment-method-loading');
            this.errorElement = this.container.querySelector('.loopit-add-payment-method-error');
            // Attach event listeners
            if (this.configSelect) {
                this.configSelect.addEventListener('change', () => {
                    this.handleConfigChange();
                });
            }
            if (this.saveButton) {
                this.saveButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSave();
                });
            }
            if (this.cancelButton) {
                this.cancelButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.options.onCancel();
                });
            }
            // Initialize with first config
            if (cardConfigs.length > 0) {
                this.currentConfigId = cardConfigs[0].id;
                await this.initializePaymentForm(cardConfigs[0]);
            }
            else {
                this.showError('No payment configurations available');
            }
            return this.container;
        }
        async handleConfigChange() {
            if (!this.configSelect)
                return;
            const configId = this.configSelect.value;
            this.currentConfigId = configId;
            // Re-initialize the payment form
            // Note: In a real implementation, we'd need to get the config object
            // For now, we'll need to fetch setup config again
            await this.fetchAndInitialize(configId);
        }
        async fetchAndInitialize(configId) {
            try {
                this.showLoading(true);
                this.hideError();
                const setupConfig = await this.options.apiClient.getSetupConfig({
                    owner_id: this.ownerId,
                    owner_type: this.ownerType,
                    config_id: configId,
                });
                this.currentSetupConfig = setupConfig;
                if (setupConfig.provider === 'stripe') {
                    await this.initializeStripe(setupConfig);
                }
                else {
                    this.showError(`Payment provider "${setupConfig.provider}" is not supported yet`);
                }
                this.showLoading(false);
            }
            catch (error) {
                this.showLoading(false);
                this.showError(error instanceof Error ? error.message : 'Failed to initialize payment form');
            }
        }
        async initializePaymentForm(config) {
            if (config.gateway.provider === 'stripe') {
                await this.fetchAndInitialize(config.id);
            }
            else {
                this.showError(`Payment provider "${config.gateway.provider}" is not supported yet`);
            }
        }
        async initializeStripe(setupConfig) {
            if (!this.stripeElementContainer)
                return;
            // Clear previous element
            clearChildren(this.stripeElementContainer);
            try {
                // Get the API key and account from the setup config
                // Note: The setup config doesn't include these, so we need to get them from somewhere
                // For now, we'll assume they're passed or available
                // In a real implementation, the API should return these
                // Initialize Stripe provider
                // We'll need the publishable key - this should come from the gateway config
                // For now, we'll need to handle this differently
                // Create a container for Stripe Elements
                const stripeContainer = document.createElement('div');
                stripeContainer.id = 'stripe-payment-element';
                this.stripeElementContainer.appendChild(stripeContainer);
                // Note: The actual Stripe initialization would happen here
                // This requires the publishable key which should be provided by the API
                // For now, we'll show a message
                if (this.saveButton) {
                    this.saveButton.disabled = false;
                }
                // Store the client secret for later use
                this.options.stripeProvider.setClientSecret(setupConfig.config.setup_intent.client_secret);
            }
            catch (error) {
                this.showError(error instanceof Error ? error.message : 'Failed to load Stripe');
            }
        }
        async handleSave() {
            if (!this.currentConfigId || !this.currentSetupConfig) {
                this.showError('No payment configuration selected');
                return;
            }
            try {
                this.showLoading(true);
                this.hideError();
                if (this.saveButton) {
                    this.saveButton.disabled = true;
                    this.saveButton.textContent = 'Saving...';
                }
                if (this.currentSetupConfig.provider === 'stripe') {
                    await this.saveStripePaymentMethod();
                }
                else {
                    throw new Error(`Provider "${this.currentSetupConfig.provider}" not supported`);
                }
            }
            catch (error) {
                this.showLoading(false);
                if (this.saveButton) {
                    this.saveButton.disabled = false;
                    this.saveButton.textContent = 'Save Payment Method';
                }
                this.showError(error instanceof Error ? error.message : 'Failed to save payment method');
            }
        }
        async saveStripePaymentMethod() {
            // Confirm the setup intent with Stripe
            const result = await this.options.stripeProvider.confirmSetup();
            if (result.error) {
                throw new Error(result.error.message);
            }
            if (!result.setupIntent?.payment_method) {
                throw new Error('Failed to create payment method');
            }
            // Save to our backend
            const paymentMethod = await this.options.apiClient.addPaymentMethod({
                owner_id: this.ownerId,
                owner_type: this.ownerType,
                config_id: this.currentConfigId,
                external_payment_method_id: result.setupIntent.payment_method,
                data: null,
            });
            this.showLoading(false);
            this.options.onSuccess(paymentMethod);
        }
        showLoading(show) {
            if (this.loadingElement) {
                setVisible(this.loadingElement, show);
            }
            if (this.stripeElementContainer) {
                this.stripeElementContainer.style.opacity = show ? '0.5' : '1';
            }
        }
        showError(message) {
            if (this.errorElement) {
                this.errorElement.textContent = message;
                setVisible(this.errorElement, true);
            }
            this.options.onError(new Error(message));
        }
        hideError() {
            if (this.errorElement) {
                setVisible(this.errorElement, false);
            }
        }
        cleanup() {
            this.options.stripeProvider.cleanup();
            this.container = null;
            this.stripeElementContainer = null;
            this.configSelect = null;
            this.saveButton = null;
            this.cancelButton = null;
            this.loadingElement = null;
            this.errorElement = null;
            this.currentConfigId = null;
            this.currentSetupConfig = null;
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

    class LoopitPayInvoiceSDK {
        constructor(config) {
            // DOM elements
            this.rootElement = null;
            this.loadingElement = null;
            this.errorElement = null;
            this.successElement = null;
            this.mainViewElement = null;
            this.addPaymentMethodViewElement = null;
            this.config = {
                currencySymbol: '$',
                locale: 'en-US',
                ...config,
            };
            this.container = getContainer(config.container);
            this.apiClient = new ApiClient({
                baseUrl: config.apiBaseUrl,
                verificationToken: config.verificationToken,
                workspace: config.workspace,
            });
            this.stripeProvider = new StripeProvider();
            this.state = {
                invoice: null,
                paymentMethods: [],
                paymentConfigs: [],
                selectedMethodId: config.paymentMethodId || null,
                amount: 0,
                isLoading: true,
                error: null,
                view: 'main',
            };
            // Initialize components
            this.invoiceDisplay = new InvoiceDisplay({
                currencySymbol: this.config.currencySymbol,
                onDownloadPdf: () => this.handleDownloadPdf(),
            });
            this.paymentMethodSelector = new PaymentMethodSelector({
                onSelect: (id) => this.handlePaymentMethodSelect(id),
                onAddNew: () => this.handleShowAddPaymentMethod(),
            });
            this.paymentForm = new PaymentForm({
                currencySymbol: this.config.currencySymbol,
                onSubmit: (amount) => this.handleSubmitPayment(amount),
                onAmountChange: (amount) => this.handleAmountChange(amount),
            });
            this.addPaymentMethod = new AddPaymentMethod({
                stripeProvider: this.stripeProvider,
                apiClient: this.apiClient,
                onSuccess: (method) => this.handlePaymentMethodAdded(method),
                onCancel: () => this.handleCancelAddPaymentMethod(),
                onError: (error) => this.showError(error.message),
            });
        }
        async init() {
            try {
                this.render();
                this.showLoading(true);
                // Load data in parallel
                const [invoice, paymentMethods, paymentConfigs] = await Promise.all([
                    this.apiClient.getInvoice(this.config.invoiceId),
                    this.apiClient.getPaymentMethods(this.config.ownerId, this.config.ownerType),
                    this.apiClient.getPaymentConfigs(),
                ]);
                this.state.invoice = invoice;
                this.state.paymentMethods = paymentMethods;
                this.state.paymentConfigs = paymentConfigs;
                this.state.amount = invoice.amount_payable;
                // Select default payment method if not pre-selected
                if (!this.state.selectedMethodId && paymentMethods.length > 0) {
                    const defaultMethod = paymentMethods.find((m) => m.is_default) || paymentMethods[0];
                    this.state.selectedMethodId = defaultMethod.id;
                }
                this.showLoading(false);
                this.updateView();
                this.config.onReady?.();
            }
            catch (error) {
                this.showLoading(false);
                this.showError(error instanceof Error ? error.message : 'Failed to initialize');
            }
        }
        render() {
            this.rootElement = document.createElement('div');
            this.rootElement.className = 'loopit-pay-invoice';
            setState(this.rootElement, 'loading');
            // Loading element
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loopit-loading';
            this.loadingElement.textContent = 'Loading...';
            // Error element
            this.errorElement = document.createElement('div');
            this.errorElement.className = 'loopit-error';
            setVisible(this.errorElement, false);
            // Success element
            this.successElement = document.createElement('div');
            this.successElement.className = 'loopit-success';
            this.successElement.textContent = 'Payment successful!';
            setVisible(this.successElement, false);
            // Main view
            this.mainViewElement = document.createElement('div');
            this.mainViewElement.className = 'loopit-main-view';
            // Add payment method view
            this.addPaymentMethodViewElement = document.createElement('div');
            this.addPaymentMethodViewElement.className = 'loopit-add-payment-method-view';
            setVisible(this.addPaymentMethodViewElement, false);
            // Assemble
            this.rootElement.appendChild(this.loadingElement);
            this.rootElement.appendChild(this.errorElement);
            this.rootElement.appendChild(this.successElement);
            this.rootElement.appendChild(this.mainViewElement);
            this.rootElement.appendChild(this.addPaymentMethodViewElement);
            clearChildren(this.container);
            this.container.appendChild(this.rootElement);
        }
        updateView() {
            if (!this.state.invoice || !this.mainViewElement)
                return;
            // Clear main view
            clearChildren(this.mainViewElement);
            // Get selected payment method and its config
            const selectedMethod = this.state.paymentMethods.find((m) => m.id === this.state.selectedMethodId);
            const surchargeRate = selectedMethod?.payment_config?.surcharge_rate || 0;
            // Render invoice display
            const invoiceElement = this.invoiceDisplay.render(this.state.invoice);
            this.mainViewElement.appendChild(invoiceElement);
            // Render payment method selector
            const methodSelectorElement = this.paymentMethodSelector.render(this.state.paymentMethods, this.state.selectedMethodId);
            this.mainViewElement.appendChild(methodSelectorElement);
            // Render payment form (only if amount is payable)
            if (this.state.invoice.amount_payable > 0) {
                const paymentFormElement = this.paymentForm.render(this.state.amount, this.state.invoice.amount_payable, surchargeRate, this.state.selectedMethodId !== null);
                this.mainViewElement.appendChild(paymentFormElement);
            }
            else {
                // Show paid or no amount due message
                const paidMessage = document.createElement('div');
                paidMessage.className = 'loopit-paid-message';
                paidMessage.textContent = this.state.invoice.is_paid
                    ? 'This invoice has been paid'
                    : 'No amount due';
                this.mainViewElement.appendChild(paidMessage);
            }
        }
        showLoading(show) {
            this.state.isLoading = show;
            if (this.loadingElement) {
                setVisible(this.loadingElement, show);
            }
            if (this.mainViewElement) {
                setVisible(this.mainViewElement, !show && this.state.view === 'main');
            }
            if (this.rootElement) {
                setState(this.rootElement, show ? 'loading' : 'ready');
            }
        }
        showError(message) {
            this.state.error = message;
            if (this.errorElement) {
                this.errorElement.textContent = message;
                setVisible(this.errorElement, true);
            }
            if (this.rootElement) {
                setState(this.rootElement, 'error');
            }
            this.config.onPaymentError?.(new Error(message));
        }
        hideError() {
            this.state.error = null;
            if (this.errorElement) {
                setVisible(this.errorElement, false);
            }
        }
        showSuccess() {
            if (this.successElement) {
                setVisible(this.successElement, true);
            }
            if (this.mainViewElement) {
                setVisible(this.mainViewElement, false);
            }
            if (this.rootElement) {
                setState(this.rootElement, 'success');
            }
        }
        handlePaymentMethodSelect(paymentMethodId) {
            this.state.selectedMethodId = paymentMethodId;
            this.hideError();
            this.updateView();
        }
        handleAmountChange(amount) {
            this.state.amount = amount;
            this.hideError();
        }
        async handleSubmitPayment(amount) {
            if (!this.state.selectedMethodId) {
                this.showError('Please select a payment method');
                return;
            }
            if (!this.state.invoice) {
                this.showError('Invoice not loaded');
                return;
            }
            try {
                this.showLoading(true);
                this.hideError();
                const payment = await this.apiClient.payInvoice({
                    invoice_id: this.state.invoice.id,
                    payment_method_id: this.state.selectedMethodId,
                    amount: amount,
                    external_id: null,
                });
                this.showLoading(false);
                if (payment.status === 'Success') {
                    this.showSuccess();
                    this.config.onPaymentSuccess?.(payment);
                }
                else if (payment.status === 'Processing') {
                    this.config.onPaymentProcessing?.();
                    // Refresh invoice to show updated status
                    await this.refreshInvoice();
                }
                else if (payment.status === 'Failed') {
                    this.showError(payment.failed_reason || 'Payment failed');
                }
            }
            catch (error) {
                this.showLoading(false);
                this.showError(error instanceof Error ? error.message : 'Payment failed');
            }
        }
        async handleDownloadPdf() {
            try {
                const { url } = await this.apiClient.getInvoicePdf(this.config.invoiceId);
                window.open(url, '_blank');
            }
            catch (error) {
                this.showError('Failed to download PDF');
            }
        }
        async handleShowAddPaymentMethod() {
            this.state.view = 'add-payment-method';
            if (this.mainViewElement) {
                setVisible(this.mainViewElement, false);
            }
            if (this.addPaymentMethodViewElement) {
                setVisible(this.addPaymentMethodViewElement, true);
                clearChildren(this.addPaymentMethodViewElement);
                const addMethodElement = await this.addPaymentMethod.render(this.config.ownerId, this.config.ownerType, this.state.paymentConfigs);
                this.addPaymentMethodViewElement.appendChild(addMethodElement);
            }
        }
        handleCancelAddPaymentMethod() {
            this.state.view = 'main';
            if (this.addPaymentMethodViewElement) {
                setVisible(this.addPaymentMethodViewElement, false);
            }
            if (this.mainViewElement) {
                setVisible(this.mainViewElement, true);
            }
            this.addPaymentMethod.cleanup();
        }
        async handlePaymentMethodAdded(method) {
            // Add to list and select it
            this.state.paymentMethods.push(method);
            this.state.selectedMethodId = method.id;
            // Switch back to main view
            this.handleCancelAddPaymentMethod();
            this.updateView();
            this.config.onPaymentMethodAdded?.(method);
        }
        async refreshInvoice() {
            try {
                const invoice = await this.apiClient.getInvoice(this.config.invoiceId);
                this.state.invoice = invoice;
                this.state.amount = invoice.amount_payable;
                this.updateView();
            }
            catch {
                // Silently fail on refresh
            }
        }
        // Public methods for external control
        selectPaymentMethod(paymentMethodId) {
            this.handlePaymentMethodSelect(paymentMethodId);
        }
        setAmount(amount) {
            this.state.amount = amount;
            this.updateView();
        }
        async submitPayment() {
            try {
                await this.handleSubmitPayment(this.state.amount);
                return null; // Payment handled via callbacks
            }
            catch {
                return null;
            }
        }
        getState() {
            return { ...this.state };
        }
        destroy() {
            this.addPaymentMethod.cleanup();
            if (this.rootElement && this.rootElement.parentNode) {
                this.rootElement.parentNode.removeChild(this.rootElement);
            }
        }
        /**
         * Update authentication token
         */
        setAuth(verificationToken) {
            this.apiClient.setAuth(verificationToken);
        }
    }

    // Global namespace for UMD build
    const LoopitPayInvoice = {
        /**
         * Initialize the Pay Invoice SDK
         *
         * @example
         * ```js
         * LoopitPayInvoice.init({
         *   container: '#pay-invoice',
         *   apiBaseUrl: 'https://api.example.com',
         *   apiKey: 'your-api-key',
         *   invoiceId: 'inv_123',
         *   ownerId: 'owner_123',
         *   ownerType: 'person',
         *   onPaymentSuccess: (payment) => {
         *     console.log('Payment successful', payment);
         *   },
         *   onPaymentError: (error) => {
         *     console.error('Payment failed', error);
         *   }
         * });
         * ```
         */
        init: async (config) => {
            const sdk = new LoopitPayInvoiceSDK(config);
            await sdk.init();
            return sdk;
        },
        /**
         * Create SDK instance without auto-initialization
         * Useful when you need more control over the initialization process
         */
        create: (config) => {
            return new LoopitPayInvoiceSDK(config);
        },
        /**
         * SDK Version
         */
        version: '1.0.0',
    };
    // Attach to window for UMD builds
    if (typeof window !== 'undefined') {
        window.LoopitPayInvoice = LoopitPayInvoice;
    }

    exports.LoopitPayInvoiceSDK = LoopitPayInvoiceSDK;
    exports.default = LoopitPayInvoice;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=loopit-pay-invoice.js.map
