<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Mail\ResetPassword;
use App\Mail\VerifyEmail;
use App\Models\EmailVerification;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => $validated['password'],
                'role' => 'customer',
                'balance' => 0,
                'is_active' => true,
                'email_verified' => false,
            ]);

            // Delete any existing tokens and create new one
            EmailVerification::where('user_id', $user->id)->delete();

            $token = Str::random(64);
            EmailVerification::create([
                'user_id' => $user->id,
                'token' => $token,
                'expires_at' => now()->addHours(24),
                'created_at' => now(),
            ]);

            // Send verification email
            Mail::to($user->email)->send(new VerifyEmail($user, $token));

            // Process referral if referral code provided
            $referralMessage = '';
            if ($request->has('ref') && $request->ref) {
                $referralService = new ReferralService();
                $referralResult = $referralService->processSignup($user, $request->ref);
                if ($referralResult['success']) {
                    $referralMessage = ' ' . $referralResult['message'];
                }
            }

            // Create API token for the user
            $apiToken = $user->createToken('auth_token')->plainTextToken;

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registration successful. Please check your email to verify your account.' . $referralMessage,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role' => $user->role,
                        'balance' => $user->balance,
                        'email_verified' => $user->email_verified,
                        'created_at' => $user->created_at,
                    ],
                    'token' => $apiToken,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        // Revoke existing tokens and create new one
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'balance' => (float) $user->balance,
                    'email_verified' => $user->email_verified,
                    'created_at' => $user->created_at,
                ],
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'balance' => (float) $user->balance,
                'email_verified' => $user->email_verified,
                'created_at' => $user->created_at,
                'last_login_at' => $user->last_login_at,
            ],
        ]);
    }

    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $verification = EmailVerification::where('token', $validated['token'])->first();

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification link.',
            ], 400);
        }

        // Check if user already verified
        if ($verification->user->email_verified) {
            $verification->delete();
            return response()->json([
                'success' => true,
                'message' => 'Email is already verified. Please login.',
            ]);
        }

        // Check if expired
        if ($verification->expires_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification link has expired. Please request a new one.',
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Mark email as verified
            $verification->user->update([
                'email_verified' => true,
                'email_verified_at' => now(),
            ]);

            // Delete all verification tokens for this user
            EmailVerification::where('user_id', $verification->user_id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully. You can now login.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Email verification failed. Please try again.',
            ], 500);
        }
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Email is already verified.',
            ], 400);
        }

        // Check for recent verification request (rate limit)
        $recentVerification = EmailVerification::where('user_id', $user->id)
            ->where('created_at', '>', now()->subMinutes(2))
            ->exists();

        if ($recentVerification) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait 2 minutes before requesting another verification email.',
            ], 429);
        }

        // Delete old tokens and create new one
        EmailVerification::where('user_id', $user->id)->delete();

        $token = Str::random(64);
        EmailVerification::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => now()->addHours(24),
            'created_at' => now(),
        ]);

        // Send verification email
        Mail::to($user->email)->send(new VerifyEmail($user, $token));

        return response()->json([
            'success' => true,
            'message' => 'Verification email sent successfully.',
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        // Always return success to prevent email enumeration
        if (!$user) {
            return response()->json([
                'success' => true,
                'message' => 'If an account with that email exists, a password reset link has been sent.',
            ]);
        }

        // Check for recent password reset requests
        $recentReset = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->where('created_at', '>', now()->subMinutes(2))
            ->exists();

        if ($recentReset) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait 2 minutes before requesting another password reset.',
            ], 429);
        }

        // Delete existing tokens and create new one
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        $token = Str::random(64);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Send reset email
        Mail::to($user->email)->send(new ResetPassword($user, $token));

        return response()->json([
            'success' => true,
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid password reset request.',
            ], 400);
        }

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->first();

        if (!$resetRecord || !Hash::check($validated['token'], $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset token.',
            ], 400);
        }

        // Check if token has expired (1 hour)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            return response()->json([
                'success' => false,
                'message' => 'Password reset token has expired.',
            ], 400);
        }

        DB::beginTransaction();

        try {
            $user->update(['password' => $validated['password']]);

            // Delete reset token and revoke all API tokens
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $user->tokens()->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. Please login with your new password.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Password reset failed. Please try again.',
            ], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20', 'unique:users,phone,' . $user->id],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'balance' => (float) $user->balance,
                'email_verified' => $user->email_verified,
            ],
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.',
            ], 400);
        }

        $user->update(['password' => $validated['password']]);

        // Revoke all other tokens except current
        $currentTokenId = $request->user()->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }

    /**
     * Get user dashboard statistics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get total spent (all completed debit transactions)
        $totalSpent = \App\Models\Transaction::where('user_id', $user->id)
            ->where('type', 'debit')
            ->where('status', 'completed')
            ->sum('amount');

        // Get order stats
        $totalOrders = \App\Models\Order::where('user_id', $user->id)->count();
        $activeOrders = \App\Models\Order::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'processing'])
            ->count();
        $completedOrders = \App\Models\Order::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        // Get recent orders
        $recentOrders = \App\Models\Order::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'type' => $order->type,
                'status' => $order->status,
                'amount_paid' => (float) $order->amount_paid,
                'product_name' => $order->product_name,
                'phone_number' => $order->phone_number,
                'created_at' => $order->created_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_spent' => (float) $totalSpent,
                'total_orders' => $totalOrders,
                'active_orders' => $activeOrders,
                'completed_orders' => $completedOrders,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }
}
