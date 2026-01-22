/**
 * Loopit Payment Method SDK - Demo Page Script
 */

(function() {
    'use strict';

    let sdkInstance = null;

    // Validate input fields
    function validateInputs() {
        const errors = [];

        const apiBaseUrl = document.getElementById('api_base_url').value.trim();
        const workspace = document.getElementById('workspace').value.trim();
        const microsite = document.getElementById('microsite').value.trim();
        const ownerId = document.getElementById('billing_owner_id').value.trim();
        const ownerType = document.getElementById('billing_owner_type').value.trim();

        if (!apiBaseUrl) {
            errors.push('API Base URL is required');
        } else if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
            errors.push('API Base URL must be a valid URL');
        }

        if (!workspace) {
            errors.push('Workspace is required');
        }

        if (!microsite) {
            errors.push('Microsite is required');
        }

        if (!ownerId) {
            errors.push('Billing Owner ID is required');
        }

        if (!ownerType) {
            errors.push('Billing Owner Type is required');
        }

        return errors;
    }

    // Show validation errors
    function showErrors(errors) {
        const errorContainer = document.getElementById('validation-errors');
        if (errors.length > 0) {
            errorContainer.innerHTML = '<strong>Please fix the following errors:</strong><ul>' +
                errors.map(e => '<li>' + e + '</li>').join('') + '</ul>';
            errorContainer.style.display = 'block';
        } else {
            errorContainer.style.display = 'none';
        }
    }

    // Initialize the SDK
    function initSDK() {
        if (typeof LoopitPaymentMethod === 'undefined') {
            console.error('LoopitPaymentMethod SDK not loaded');
            showErrors(['LoopitPaymentMethod SDK not loaded']);
            return;
        }

        // Read all config values from input fields
        const apiBaseUrl = document.getElementById('api_base_url').value.trim();
        const workspace = document.getElementById('workspace').value.trim();
        const microsite = document.getElementById('microsite').value.trim();
        const ownerId = document.getElementById('billing_owner_id').value.trim();
        const ownerType = document.getElementById('billing_owner_type').value.trim();

        console.log('SDK Init - apiBaseUrl:', apiBaseUrl, 'workspace:', workspace, 'microsite:', microsite, 'ownerId:', ownerId, 'ownerType:', ownerType);

        // Show SDK container
        document.getElementById('sdk-container').style.display = 'block';

        // Hide load button
        document.getElementById('load-sdk-btn').style.display = 'none';

        // Disable input fields
        document.getElementById('api_base_url').disabled = true;
        document.getElementById('workspace').disabled = true;
        document.getElementById('microsite').disabled = true;
        document.getElementById('billing_owner_id').disabled = true;
        document.getElementById('billing_owner_type').disabled = true;

        sdkInstance = LoopitPaymentMethod.mount('#loopit-payment-method', {
            apiBaseUrl: apiBaseUrl,
            workspace: workspace,
            microsite: microsite,
            ownerId: ownerId,
            ownerType: ownerType,

            onPaymentMethodAdded: function(paymentMethod) {
                console.log('Payment method added:', paymentMethod);

                // Show result
                document.getElementById('result-payment-method-id').textContent = paymentMethod.id;
                document.getElementById('demo-result').style.display = 'block';
            },

            onPaymentMethodRemoved: function() {
                console.log('Payment method removed');

                // Hide result
                document.getElementById('demo-result').style.display = 'none';
            },

            onError: function(error) {
                console.error('SDK Error:', error);
                alert('Error: ' + error.message);
            }
        });
    }

    // Handle load button click
    function handleLoadClick() {
        const errors = validateInputs();

        if (errors.length > 0) {
            showErrors(errors);
            return;
        }

        showErrors([]);
        initSDK();
    }

    // Set up event listener
    const loadBtn = document.getElementById('load-sdk-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadClick);
    }
})();
