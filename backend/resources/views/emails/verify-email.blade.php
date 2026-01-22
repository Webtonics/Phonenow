<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
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
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>PhoneNow</h1>
        </div>

        <h2>Verify Your Email Address</h2>

        <p>Hello {{ $user->name }},</p>

        <p>Thank you for registering with PhoneNow! Please click the button below to verify your email address and activate your account.</p>

        <p style="text-align: center;">
            <a href="{{ $verificationUrl }}" class="button">Verify Email Address</a>
        </p>

        <p>This verification link will expire in 24 hours.</p>

        <p>If you didn't create an account with PhoneNow, please ignore this email.</p>

        <p class="link-fallback">
            If the button above doesn't work, copy and paste this link into your browser:<br>
            {{ $verificationUrl }}
        </p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} PhoneNow. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
