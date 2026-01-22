import { ShoppingCart } from 'lucide-react';

export const OrdersPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      <div className="card">
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Orders Yet
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Your order history will appear here once you make a purchase.
          </p>
        </div>
      </div>
    </div>
  );
};
