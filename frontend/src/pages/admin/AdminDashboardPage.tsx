import { Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

export const AdminDashboardPage = () => {
  const stats = [
    { name: 'Total Users', value: '0', icon: Users, color: 'bg-primary-500' },
    { name: 'Total Orders', value: '0', icon: ShoppingCart, color: 'bg-secondary-500' },
    { name: 'Revenue', value: '₦0', icon: TrendingUp, color: 'bg-accent-500' },
    { name: 'Failed Orders', value: '0', icon: AlertTriangle, color: 'bg-error-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No orders yet</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No transactions yet</p>
          </div>
        </div>
      </div>
    </div>
  );
};
