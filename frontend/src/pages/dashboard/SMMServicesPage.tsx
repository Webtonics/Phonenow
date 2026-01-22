import { Share2 } from 'lucide-react';

export const SMMServicesPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">SMM Services</h1>

      <div className="card">
        <div className="text-center py-12">
          <Share2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Social Media Marketing
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Grow your social presence with followers, likes, and views.
            Backend integration coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};
