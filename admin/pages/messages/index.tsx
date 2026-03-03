import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DataTable, { Column } from '@/components/Common/DataTable';
import { Message } from '@/types';
import { apiClient } from '@/lib/api';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';
import { Send, Plus } from 'lucide-react';

const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [currentPage]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/messages/list', {
        params: { page: currentPage, pageSize: 10 },
      });
      if (response.success && response.data) {
        setMessages(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Message>[] = [
    {
      key: 'id',
      label: 'Message ID',
      render: (value) => value.substring(0, 8),
    },
    {
      key: 'content',
      label: 'Preview',
      render: (value) => value.substring(0, 50) + (value.length > 50 ? '...' : ''),
    },
    {
      key: 'channel',
      label: 'Channel',
      render: (value) => (
        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full capitalize">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            value === 'read'
              ? 'bg-blue-100 text-blue-700'
              : value === 'delivered'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage user messages</p>
          </div>
          <Button
            icon={Send}
            onClick={() => setIsSendModalOpen(true)}
          >
            Send Message
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{messages.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Unread</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {messages.filter((m) => m.status !== 'read').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">WhatsApp</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {messages.filter((m) => m.channel === 'whatsapp').length}
            </p>
          </div>
        </div>

        <DataTable<Message>
          columns={columns}
          data={messages}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          searchPlaceholder="Search messages..."
          actionColumn={{
            label: 'Actions',
            actions: [
              {
                label: 'View',
                onClick: (row) => {
                  setSelectedMessage(row);
                  setIsModalOpen(true);
                },
                color: 'blue',
              },
            ],
          }}
        />

        {/* View Message Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Message Details"
          size="lg"
        >
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Channel</label>
                  <p className="text-gray-900 capitalize">{selectedMessage.channel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-gray-900 capitalize">{selectedMessage.status}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <p className="text-gray-900 mt-2 p-3 bg-gray-50 rounded">
                  {selectedMessage.content}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Sent</label>
                <p className="text-gray-900">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="border-t pt-4 flex gap-3">
                <Button variant="primary">Reply</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Send Message Modal */}
        <Modal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          title="Send Message"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                <option>WhatsApp</option>
                <option>Email</option>
                <option>In-app</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                placeholder="Type your message..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-3 border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsSendModalOpen(false)}
              >
                Cancel
              </Button>
              <Button icon={Send}>Send</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default MessagesPage;
