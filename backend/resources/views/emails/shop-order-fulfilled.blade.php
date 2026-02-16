<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Activation Code is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #059669, #047857); border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center;">
                            <img src="{{ config('app.url') }}/tonicstools_logo.png" alt="TonicsTools" style="height: 40px; max-width: 180px; margin-bottom: 8px;" />
                            <p style="color: #A7F3D0; font-size: 14px; margin: 0;">VPN Shop</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="background-color: #ffffff; padding: 40px;">
                            <!-- Success Badge -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 50px; padding: 10px 24px;">
                                            <span style="color: #065F46; font-size: 15px; font-weight: 600;">Your Code is Ready</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                Hello {{ $user->name }},
                            </p>

                            <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                                Your <strong style="color: #1F2937;">{{ $product->name }}</strong> activation code has been delivered and is ready for you to use.
                            </p>

                            <!-- Order Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 12px; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 20px 24px;">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; font-weight: 600;">Order Details</p>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; width: 40%;">Reference</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600;">{{ $order->reference }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">Product</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB;">{{ $product->name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">Duration</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB;">{{ $product->duration_label }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">Amount Paid</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB;">₦{{ number_format($order->amount_paid, 2) }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            @if($order->activation_instructions)
                            <!-- Instructions -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px 20px;">
                                        <p style="color: #1E40AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">Activation Instructions</p>
                                        <p style="color: #1E3A5F; font-size: 13px; margin: 0; line-height: 1.6;">{{ $order->activation_instructions }}</p>
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $viewUrl }}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">View My Orders</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0;">
                                Log in to your TonicsTools dashboard to view your activation code and instructions.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; border-radius: 0 0 12px 12px; padding: 24px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px 0;">&copy; {{ date('Y') }} TonicsTools. All rights reserved.</p>
                            <p style="color: #D1D5DB; font-size: 11px; margin: 0;">This is an automated message. Please do not reply.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
