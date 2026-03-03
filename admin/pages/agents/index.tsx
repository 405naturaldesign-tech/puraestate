import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DataTable, { Column } from '@/components/Common/DataTable';
import { Agent } from '@/types';
import { apiClient } from '@/lib/api';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';
import { Star, CheckCircle } from 'lucide-react';

const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [currentPage]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/agents/list', {
        params: { page: currentPage, pageSize: 10 },
      });
      if (response.success && response.data) {
        setAgents(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (agent: Agent) => {
    try {
      await apiClient.put(`/api/agents/${agent.id}`, {
        verified: true,
        verificationDate: new Date(),
      });
      setAgents(
        agents.map((a) =>
          a.id === agent.id
            ? { ...a, verified: true, verificationDate: new Date() }
            : a
        )
      );
    } catch (error) {
      console.error('Error verifying agent:', error);
    }
  };

  const columns: Column<Agent>[] = [
    {
      key: 'user',
      label: 'Agent Name',
      render: (value) => value.name,
    },
    {
      key: 'user',
      label: 'Email',
      render: (value) => value.email,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="font-semibold">{value.toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: 'totalBookings',
      label: 'Bookings',
    },
    {
      key: 'verified',
      label: 'Verification',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CheckCircle
            size={16}
            className={value ? 'text-green-500' : 'text-gray-400'}
          />
          <span>{value ? 'Verified' : 'Pending'}</span>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents Management</h1>
          <p className="text-gray-600 mt-1">Monitor agent performance and verify credentials</p>
        </div>

        <DataTable<Agent>
          columns={columns}
          data={agents}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          searchPlaceholder="Search agents..."
          actionColumn={{
            label: 'Actions',
            actions: [
              {
                label: 'View',
                onClick: (row) => {
                  setSelectedAgent(row);
                  setIsModalOpen(true);
                },
                color: 'blue',
              },
              {
                label: 'Verify',
                onClick: handleVerify,
                color: 'green',
              },
            ],
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Agent Profile"
          size="lg"
        >
          {selectedAgent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  {selectedAgent.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedAgent.user.name}</h3>
                  <p className="text-sm text-gray-500">{selectedAgent.user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Rating</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="text-yellow-500 fill-yellow-500" size={16} />
                    <span className="font-semibold">{selectedAgent.rating}</span>
                    <span className="text-sm text-gray-500">
                      ({selectedAgent.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Bookings</label>
                  <p className="text-gray-900">{selectedAgent.totalBookings}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">License</label>
                  <p className="text-gray-900">{selectedAgent.license}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">License Expiry</label>
                  <p className="text-gray-900">
                    {new Date(selectedAgent.licenseExpiry).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedAgent.agency && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Agency</label>
                  <p className="text-gray-900">{selectedAgent.agency}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Total Commission
                </label>
                <p className="text-gray-900">${selectedAgent.totalCommission.toLocaleString()}</p>
              </div>

              <div className="border-t pt-4 flex gap-3">
                <Button variant="primary">View Details</Button>
                {!selectedAgent.verified && (
                  <Button
                    variant="success"
                    onClick={() => handleVerify(selectedAgent)}
                  >
                    Verify Agent
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AgentsPage;
