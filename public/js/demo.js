/**
 * Loopit Payment Method SDK - Demo Page Script
 */

(function() {
    'use strict';

    var sdkInstance = null;
    var selectedType = 'card';

    // Pre-filled configs per payment method type preset
    var TYPE_CONFIGS = {
        card: {
            workspace:          'rupesh-us-demo',
            microsite:          'rupesh-us-demo.myloopit.com',
            ownerId:            'a0c29b4e-3903-472c-aadb-05c4a7420103',
            ownerType:          'person',
            paymentMethodTypes: ['card'],
        },
        au_becs_debit: {
            workspace:          'carbar-demo-data-demo',
            microsite:          'carbar-demo-data-demo.myloopit.com',
            ownerId:            'a17c3720-36c9-4287-98a2-ad311705f2fc',
            ownerType:          'person',
            paymentMethodTypes: ['au_becs_debit'],
        },
        both: {
            workspace:          'carbar-demo-data-demo',
            microsite:          'carbar-demo-data-demo.myloopit.com',
            ownerId:            'a17c3720-36c9-4287-98a2-ad311705f2fc',
            ownerType:          'person',
            paymentMethodTypes: ['card', 'au_becs_debit'],
        },
    };

    var TYPE_DISPLAY_NAMES = {
        card:          'Card',
        au_becs_debit: 'AU BECS Direct Debit',
    };

    var TYPE_BADGE_STYLES = {
        card:          { background: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
        au_becs_debit: { background: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
    };

    // Apply a type config preset to the input fields
    function applyTypeConfig(type) {
        var cfg = TYPE_CONFIGS[type];
        if (!cfg) return;
        document.getElementById('workspace').value          = cfg.workspace;
        document.getElementById('microsite').value          = cfg.microsite;
        document.getElementById('billing_owner_id').value   = cfg.ownerId;
        document.getElementById('billing_owner_type').value = cfg.ownerType;
    }

    // Get paymentMethodTypes array for the selected preset
    function getPaymentMethodTypes(type) {
        return (TYPE_CONFIGS[type] || {}).paymentMethodTypes || undefined;
    }

    // Update the type selector button styles
    function setActiveTypeBtn(type) {
        var btns = document.querySelectorAll('.type-btn');
        btns.forEach(function(btn) {
            var isActive = btn.getAttribute('data-type') === type;
            btn.style.border     = isActive ? '2px solid #3B82F6' : '2px solid #D1D5DB';
            btn.style.background = isActive ? '#EFF6FF' : '#F9FAFB';
            btn.style.color      = isActive ? '#1D4ED8' : '#374151';
        });
    }

    // Handle type button clicks
    function handleTypeClick(e) {
        var btn = e.currentTarget;
        var type = btn.getAttribute('data-type');
        if (!type) return;
        selectedType = type;
        setActiveTypeBtn(type);
        applyTypeConfig(type);
    }

    // Validate input fields
    function validateInputs() {
        var errors = [];
        var apiBaseUrl = document.getElementById('api_base_url').value.trim();
        var workspace  = document.getElementById('workspace').value.trim();
        var microsite  = document.getElementById('microsite').value.trim();
        var ownerId    = document.getElementById('billing_owner_id').value.trim();
        var ownerType  = document.getElementById('billing_owner_type').value.trim();

        if (!apiBaseUrl) {
            errors.push('API Base URL is required');
        } else if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
            errors.push('API Base URL must be a valid URL');
        }
        if (!workspace) errors.push('Workspace is required');
        if (!microsite) errors.push('Microsite is required');
        if (!ownerId)   errors.push('Billing Owner ID is required');
        if (!ownerType) errors.push('Billing Owner Type is required');

        return errors;
    }

    function showErrors(errors) {
        var el = document.getElementById('validation-errors');
        if (errors.length > 0) {
            el.innerHTML = '<strong>Please fix the following errors:</strong><ul>' +
                errors.map(function(e) { return '<li>' + e + '</li>'; }).join('') + '</ul>';
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    }

    // Show the detected payment method type badge
    function showDetectedType(type) {
        var badge = document.getElementById('detected-type-badge');
        var label = document.getElementById('detected-type-label');
        if (!badge || !label) return;

        label.textContent = TYPE_DISPLAY_NAMES[type] || type;

        var styles = TYPE_BADGE_STYLES[type] || TYPE_BADGE_STYLES['card'];
        label.style.background  = styles.background;
        label.style.color       = styles.color;
        label.style.borderColor = styles.border;

        badge.style.display = 'block';
    }

    // Reset the demo back to the config form
    function resetDemo() {
        if (sdkInstance) {
            sdkInstance.unmount();
            sdkInstance = null;
        }

        var mountPoint = document.getElementById('loopit-payment-method');
        if (mountPoint) mountPoint.innerHTML = '';

        document.getElementById('sdk-container').style.display   = 'none';
        document.getElementById('demo-result').style.display     = 'none';
        document.getElementById('detected-type-badge').style.display = 'none';
        document.getElementById('type-selector').style.display   = 'flex';

        document.getElementById('api_base_url').disabled         = false;
        document.getElementById('workspace').disabled            = false;
        document.getElementById('microsite').disabled            = false;
        document.getElementById('billing_owner_id').disabled     = false;
        document.getElementById('billing_owner_type').disabled   = false;
        document.getElementById('load-sdk-btn').style.display    = '';

        // Re-enable type buttons
        document.querySelectorAll('.type-btn').forEach(function(btn) {
            btn.disabled = false;
        });
    }

    // Initialize the SDK
    function initSDK() {
        if (typeof LoopitPaymentMethod === 'undefined') {
            showErrors(['LoopitPaymentMethod SDK not loaded']);
            return;
        }

        var apiBaseUrl = document.getElementById('api_base_url').value.trim();
        var workspace  = document.getElementById('workspace').value.trim();
        var microsite  = document.getElementById('microsite').value.trim();
        var ownerId    = document.getElementById('billing_owner_id').value.trim();
        var ownerType  = document.getElementById('billing_owner_type').value.trim();

        // Hide type selector and config form, show SDK container
        document.getElementById('type-selector').style.display   = 'none';
        document.getElementById('sdk-container').style.display   = 'block';
        document.getElementById('load-sdk-btn').style.display    = 'none';
        document.getElementById('api_base_url').disabled         = true;
        document.getElementById('workspace').disabled            = true;
        document.getElementById('microsite').disabled            = true;
        document.getElementById('billing_owner_id').disabled     = true;
        document.getElementById('billing_owner_type').disabled   = true;
        document.querySelectorAll('.type-btn').forEach(function(btn) {
            btn.disabled = true;
        });

        sdkInstance = LoopitPaymentMethod.mount('#loopit-payment-method', {
            apiBaseUrl:         apiBaseUrl,
            workspace:          workspace,
            microsite:          microsite,
            ownerId:            ownerId,
            ownerType:          ownerType,
            paymentMethodTypes: getPaymentMethodTypes(selectedType),

            // Show detected type badge as soon as config is resolved
            onConfigLoaded: function(config) {
                var type = config && config.payment_method_type && config.payment_method_type.type;
                if (type) showDetectedType(type.toLowerCase());
            },

            onPaymentMethodAdded: function(paymentMethod) {
                console.log('Payment method added:', paymentMethod);
                document.getElementById('result-payment-method-id').textContent   = paymentMethod.id;
                document.getElementById('result-payment-method-type').textContent = paymentMethod.type || '—';
                document.getElementById('demo-result').style.display = 'block';
            },

            onPaymentMethodRemoved: function() {
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
        var errors = validateInputs();
        if (errors.length > 0) {
            showErrors(errors);
            return;
        }
        showErrors([]);
        initSDK();
    }

    // Wire up type selector buttons
    document.querySelectorAll('.type-btn').forEach(function(btn) {
        btn.addEventListener('click', handleTypeClick);
    });

    var loadBtn = document.getElementById('load-sdk-btn');
    if (loadBtn) loadBtn.addEventListener('click', handleLoadClick);

    var resetBtn = document.getElementById('reset-sdk-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetDemo);

    // Apply default config on load
    applyTypeConfig(selectedType);
    setActiveTypeBtn(selectedType);

})();
