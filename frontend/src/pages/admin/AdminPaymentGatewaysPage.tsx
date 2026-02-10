import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { adminService, getErrorMessage } from '@/services';
import type { PaymentGateway } from '@/types';
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FlaskConical,
  Globe,
  RefreshCw,
} from 'lucide-react';

const gatewayIcons: Record<string, React.ReactNode> = {
  'credit-card': <CreditCard className="w-7 h-7" />,
  'bitcoin': <span className="text-2xl">&#8383;</span>,
  'globe': <Globe className="w-7 h-7" />,
};

export const AdminPaymentGatewaysPage = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPaymentGateways();
      if (response.success && response.data) {
        setGateways(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleToggle = async (gatewayId: string, currentStatus: boolean) => {
    setToggling(gatewayId);
    try {
      const response = await adminService.updatePaymentGateway(gatewayId, {
        enabled: !currentStatus,
      });

      if (response.success) {
        toast.success(`Gateway ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
        setGateways(prev =>
          prev.map(g =>
            g.id === gatewayId ? { ...g, enabled: !currentStatus } : g
          )
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setToggling(null);
    }
  };

  const handleTest = async (gatewayId: string) => {
    setTesting(gatewayId);
    try {
      const response = await adminService.testPaymentGateway(gatewayId);

      if (response.success) {
        toast.success(response.message || 'Connection test successful!');
      } else {
        toast.error(response.message || 'Connection test failed');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Gateways</h1>
          <p className="text-sm text-gray-600 mt-1">Manage payment provider integrations</p>
        </div>
        <button
          onClick={() => fetchGateways()}
          className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gateways.map((gateway) => (
          <div
            key={gateway.id}
            className={`card p-6 border-2 transition-colors ${
              gateway.enabled && gateway.configured
                ? 'border-green-200 bg-green-50/30'
                : gateway.enabled && !gateway.configured
                ? 'border-yellow-200 bg-yellow-50/30'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${
                  gateway.enabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {gatewayIcons[gateway.icon] || <CreditCard className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
                  <p className="text-xs text-gray-500">{gateway.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {gateway.configured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3" />
                    Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                    <AlertCircle className="w-3 h-3" />
                    Not Configured
                  </span>
                )}

                {gateway.enabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleToggle(gateway.id, gateway.enabled)}
                  disabled={toggling === gateway.id}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    gateway.enabled
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {toggling === gateway.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : gateway.enabled ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </button>

                {gateway.configured && (
                  <button
                    onClick={() => handleTest(gateway.id)}
                    disabled={testing === gateway.id}
                    className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-colors"
                    title="Test connection"
                  >
                    {testing === gateway.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FlaskConical className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {!gateway.configured && (
                <p className="text-xs text-gray-500 mt-2">
                  Configure API keys in .env file to use this gateway
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Configuration Notes</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs">
              <li>Gateway credentials are stored securely in the .env file</li>
              <li>Only enabled and configured gateways appear to users</li>
              <li>Disabling a gateway won't affect completed transactions</li>
              <li>Test connections before enabling gateways in production</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
