<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #3B82F6;
            font-size: 28px;
            margin: 0;
        }
        h2 {
            color: #1f2937;
            margin-bottom: 20px;
        }
        p {
            color: #4b5563;
            margin-bottom: 15px;
        }
        .button {
            display: inline-block;
            background-color: #3B82F6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
        }
        .link-fallback {
            word-break: break-all;
            color: #6b7280;
            font-size: 12px;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            font-size: 13px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>PhoneNow</h1>
        </div>

        <h2>Reset Your Password</h2>

        <p>Hello {{ $user->name }},</p>

        <p>We received a request to reset your password for your PhoneNow account. Click the button below to set a new password.</p>

        <p style="text-align: center;">
            <a href="{{ $resetUrl }}" class="button">Reset Password</a>
        </p>

        <p>This password reset link will expire in 1 hour.</p>

        <div class="warning">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </div>

        <p class="link-fallback">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            {{ $resetUrl }}
        </p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} PhoneNow. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
