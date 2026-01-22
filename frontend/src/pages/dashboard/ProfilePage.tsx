import { useAuth } from '@/stores/AuthContext';
import { User, Mail, Phone } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="card">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary-500" />
          </div>
          <div className="ml-6">
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-gray-600">{user?.email}</p>
            <span className="badge-info mt-2">{user?.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">
                {user?.phone || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
