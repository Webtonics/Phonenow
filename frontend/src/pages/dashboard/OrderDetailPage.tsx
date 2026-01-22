import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const OrderDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/orders" className="btn-outline p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Order #{id}</h1>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-600">Order details will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};
