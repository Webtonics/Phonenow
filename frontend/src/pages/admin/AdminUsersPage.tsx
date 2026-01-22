import { Users } from 'lucide-react';

export const AdminUsersPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            User List
          </h2>
          <p className="text-gray-600">
            User management functionality will be available here.
          </p>
        </div>
      </div>
    </div>
  );
};
