<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReferralService;
use App\Services\ReferralWithdrawalService;
use App\Models\Referral;
use App\Models\ReferralCommission;
use App\Models\ReferralCode;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReferralAdminController extends Controller
{
    protected $referralService;
    protected $withdrawalService;

    public function __construct(ReferralService $referralService, ReferralWithdrawalService $withdrawalService)
    {
        $this->referralService = $referralService;
        $this->withdrawalService = $withdrawalService;
    }

    /**
     * Get referral dashboard stats
     */
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_referrals' => Referral::count(),
            'active_referrals' => Referral::where('status', 'active')->count(),
            'total_users_with_referrals' => ReferralCode::where('total_referrals', '>', 0)->count(),
            'total_commissions_paid' => ReferralCommission::where('status', 'paid')->sum('commission_amount'),
            'pending_commissions' => ReferralCommission::where('status', 'pending')->sum('commission_amount'),
            'pending_withdrawals' => WithdrawalRequest::where('status', 'pending')->sum('amount'),
            'total_withdrawals' => WithdrawalRequest::where('status', 'approved')->sum('amount'),
        ];

        // Top referrers
        $topReferrers = ReferralCode::with('user:id,name,email')
            ->where('total_referrals', '>', 0)
            ->orderBy('total_earnings', 'desc')
            ->limit(10)
            ->get();

        // Recent referrals
        $recentReferrals = Referral::with(['referrer:id,name,email', 'referee:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'top_referrers' => $topReferrers,
                'recent_referrals' => $recentReferrals,
            ],
        ]);
    }

    /**
     * Get all withdrawal requests
     */
    public function getWithdrawals(Request $request): JsonResponse
    {
        $filters = $request->only(['status', 'user_id', 'per_page']);
        $result = $this->withdrawalService->getAllWithdrawalRequests($filters);

        return response()->json($result);
    }

    /**
     * Approve withdrawal request
     */
    public function approveWithdrawal(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
        ]);

        $result = $this->withdrawalService->approveWithdrawal(
            $id,
            $request->user(),
            $validated['note'] ?? null
        );

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    /**
     * Reject withdrawal request
     */
    public function rejectWithdrawal(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $result = $this->withdrawalService->rejectWithdrawal(
            $id,
            $request->user(),
            $validated['reason']
        );

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    /**
     * Get all referrals with pagination
     */
    public function getReferrals(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 20);

        $referrals = Referral::with(['referrer:id,name,email', 'referee:id,name,email'])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->referrer_id, fn($q, $id) => $q->where('referrer_id', $id))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $referrals->items(),
            'meta' => [
                'current_page' => $referrals->currentPage(),
                'last_page' => $referrals->lastPage(),
                'per_page' => $referrals->perPage(),
                'total' => $referrals->total(),
            ],
        ]);
    }

    /**
     * Get all commissions with pagination
     */
    public function getCommissions(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 20);

        $commissions = ReferralCommission::with([
            'referrer:id,name,email',
            'referee:id,name,email'
        ])
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->when($request->referrer_id, fn($q, $id) => $q->where('referrer_id', $id))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $commissions->items(),
            'meta' => [
                'current_page' => $commissions->currentPage(),
                'last_page' => $commissions->lastPage(),
                'per_page' => $commissions->perPage(),
                'total' => $commissions->total(),
            ],
        ]);
    }

    /**
     * Get user referral details
     */
    public function getUserReferralDetails(int $userId): JsonResponse
    {
        $stats = $this->referralService->getReferralStats($userId);

        $referrals = Referral::where('referrer_id', $userId)
            ->with('referee:id,name,email,created_at')
            ->get();

        $commissions = ReferralCommission::where('referrer_id', $userId)
            ->with('referee:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'referrals' => $referrals,
                'commissions' => $commissions,
            ],
        ]);
    }
}
