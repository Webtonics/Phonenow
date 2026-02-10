<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your eSIM is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3B82F6, #2563EB); border-radius: 12px 12px 0 0; padding: 32px 40px; text-align: center;">
                            <img src="{{ config('app.url') }}/tonicstools_logo.png" alt="TonicsTools" style="height: 40px; max-width: 180px; margin-bottom: 8px;" />
                            <p style="color: #BFDBFE; font-size: 14px; margin: 0;">Global eSIM Connectivity</p>
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
                                            <span style="color: #065F46; font-size: 15px; font-weight: 600;">Your eSIM is Ready</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                                Hello {{ $profile->user->name }},
                            </p>

                            <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                                Your eSIM for <strong style="color: #1F2937;">{{ $profile->country_name }}</strong> has been activated and is ready to install on your device.
                            </p>

                            <!-- QR Code -->
                            @if($qrCodeUrl)
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 16px; padding: 24px; display: inline-block;">
                                            <p style="color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; font-weight: 600;">Scan to Install</p>
                                            <img src="{{ $qrCodeUrl }}" alt="eSIM QR Code" width="200" height="200" style="display: block; margin: 0 auto; border-radius: 8px;" />
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- Order Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 12px; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 20px 24px;">
                                        <p style="color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0; font-weight: 600;">Order Details</p>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; width: 40%;">Order No.</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600;">{{ $profile->order_no }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">Country</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB;">{{ $profile->country_name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">Data</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB;">{{ $profile->formatted_data }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">Validity</td>
                                                <td style="color: #1F2937; font-size: 14px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB;">{{ $profile->duration_days }} days</td>
                                            </tr>
                                            @if($profile->iccid)
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; padding: 6px 0; border-top: 1px solid #E5E7EB;">ICCID</td>
                                                <td style="color: #1F2937; font-size: 13px; padding: 6px 0; font-weight: 600; border-top: 1px solid #E5E7EB; font-family: monospace;">{{ $profile->iccid }}</td>
                                            </tr>
                                            @endif
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Activation Code -->
                            @if($lpaString)
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px 20px;">
                                        <p style="color: #1E40AF; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">Manual Activation Code</p>
                                        <p style="color: #1E3A5F; font-size: 13px; margin: 0; font-family: monospace; word-break: break-all; line-height: 1.5;">{{ $lpaString }}</p>
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $viewUrl }}" style="display: inline-block; background-color: #3B82F6; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">View My eSIMs</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Quick Install Guide -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p style="color: #92400E; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">Quick Install Guide</p>
                                        <p style="color: #78350F; font-size: 13px; line-height: 1.6; margin: 0;">
                                            <strong>iPhone:</strong> Settings &rarr; Cellular &rarr; Add eSIM &rarr; Use QR Code<br>
                                            <strong>Android:</strong> Settings &rarr; Connections &rarr; SIM Manager &rarr; Add eSIM
                                        </p>
                                    </td>
                                </tr>
                            </table>
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
