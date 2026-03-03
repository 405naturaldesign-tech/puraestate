import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DataTable, { Column } from '@/components/Common/DataTable';
import { User } from '@/types';
import { apiClient } from '@/lib/api';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/users/list', {
        params: { page: currentPage, pageSize: 10 },
      });
      if (response.success && response.data) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    try {
      await apiClient.put(`/api/users/${user.id}`, {
        isActive: false,
      });
      setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: false } : u)));
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full capitalize">
          {value}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            value
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">Manage all users and subscriptions</p>
        </div>

        <DataTable<User>
          columns={columns}
          data={users}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          searchPlaceholder="Search users by name or email..."
          actionColumn={{
            label: 'Actions',
            actions: [
              {
                label: 'View',
                onClick: (row) => {
                  setSelectedUser(row);
                  setIsModalOpen(true);
                },
                color: 'blue',
              },
              {
                label: 'Deactivate',
                onClick: handleDeactivate,
                color: 'red',
              },
            ],
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="User Profile"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-gray-900">
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {selectedUser.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{selectedUser.phone}</p>
                </div>
              )}

              {selectedUser.subscription && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-700">Subscription</label>
                  <p className="text-gray-900">{selectedUser.subscription.name}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button variant="primary">Edit</Button>
                <Button variant="danger">Ban User</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
