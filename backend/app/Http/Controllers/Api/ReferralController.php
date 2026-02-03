<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReferralService;
use App\Services\ReferralFraudService;
use App\Services\ReferralWithdrawalService;
use App\Models\Referral;
use App\Models\ReferralCommission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReferralController extends Controller
{
    protected $referralService;
    protected $withdrawalService;

    public function __construct(ReferralService $referralService, ReferralWithdrawalService $withdrawalService)
    {
        $this->referralService = $referralService;
        $this->withdrawalService = $withdrawalService;
    }

    public function index(Request $request): JsonResponse
    {
        $stats = $this->referralService->getReferralStats($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'referral_code' => $request->user()->referral_code,
                'referral_link' => $request->user()->getReferralLink(),
            ],
        ]);
    }

    public function getCode(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $user->referral_code,
                'link' => $user->getReferralLink(),
            ],
        ]);
    }

    public function getReferrals(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 10);

        $referrals = Referral::where('referrer_id', $request->user()->id)
            ->with('referee:id,name,email,created_at')
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

    public function getCommissions(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 10);

        $commissions = ReferralCommission::where('referrer_id', $request->user()->id)
            ->with('referee:id,name,email')
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

    public function requestWithdrawal(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:' . config('referral.min_withdrawal_amount', 5000),
        ]);

        $result = $this->withdrawalService->requestWithdrawal($request->user(), $request->amount);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    public function getWithdrawals(Request $request): JsonResponse
    {
        $result = $this->withdrawalService->getWithdrawalRequests($request->user());

        return response()->json($result);
    }
}
