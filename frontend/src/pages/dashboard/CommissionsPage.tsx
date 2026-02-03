import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { referralService, type ReferralCommission } from '@/services/referral.service';

export const CommissionsPage = () => {
  const navigate = useNavigate();
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCommissions();
  }, [page]);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const response = await referralService.getCommissions({ page, per_page: 10 });
      if (response.success) {
        setCommissions(response.data);
        setTotalPages(response.meta.last_page);
        setTotal(response.meta.total);
      }
    } catch (error) {
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalEarned = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const pendingEarnings = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/referrals')}
          className="btn-secondary p-2 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commission History</h1>
          <p className="text-sm text-gray-600">{total} total commissions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs sm:text-sm text-green-700 font-medium">Total Earned</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-900">₦{totalEarned.toLocaleString()}</p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-xs sm:text-sm text-yellow-700 font-medium">Pending</p>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-900">₦{pendingEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* Commissions List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium mb-1">No commissions yet</p>
            <p className="text-sm text-gray-400">Commissions will appear here when your referrals make purchases</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">From</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Transaction</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Rate</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Commission</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{commission.referee.name}</p>
                          <p className="text-sm text-gray-500">{commission.referee.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{commission.transaction_type}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ₦{commission.transaction_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-sm text-primary-700">
                          <TrendingUp className="w-3 h-3" />
                          {commission.commission_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        ₦{commission.commission_amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)}`}>
                          {getStatusIcon(commission.status)}
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {commissions.map((commission) => (
                <div key={commission.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{commission.referee.name}</p>
                      <p className="text-xs text-gray-500 truncate">{commission.transaction_type}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(commission.status)} flex-shrink-0 ml-2`}>
                      {getStatusIcon(commission.status)}
                      {commission.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Transaction Amount</p>
                      <p className="font-medium text-gray-900">₦{commission.transaction_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Commission ({commission.commission_rate}%)</p>
                      <p className="font-bold text-green-600">₦{commission.commission_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{new Date(commission.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline text-sm py-1.5 px-3 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-outline text-sm py-1.5 px-3 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
