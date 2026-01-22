<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Loopit Payment SDK')</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f3f4f6;
            color: #1f2937;
            line-height: 1.5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card-header {
            margin-bottom: 16px;
        }
        .card-title {
            margin: 0 0 8px;
            font-size: 1.5rem;
            font-weight: 600;
        }
        .card-description {
            margin: 0;
            color: #6b7280;
        }
        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
        }
        .alert-info {
            background: #eff6ff;
            color: #1e40af;
        }
        .alert-warning {
            background: #fffbeb;
            color: #92400e;
        }
        .alert-success {
            background: #f0fdf4;
            color: #166534;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 6px;
            color: #374151;
        }
        .form-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
            text-decoration: none;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        .btn-primary:hover {
            background: #2563eb;
        }
        .btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.875em;
        }
        pre code {
            background: transparent;
            padding: 0;
        }
    </style>
    @yield('styles')
</head>
<body>
    <div class="container">
        @yield('content')
    </div>
    @yield('scripts')
</body>
</html>
