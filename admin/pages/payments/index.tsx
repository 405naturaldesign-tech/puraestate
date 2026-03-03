import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DataTable, { Column } from '@/components/Common/DataTable';
import { Transaction } from '@/types';
import { apiClient } from '@/lib/api';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';
import { Download } from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/payments/transactions', {
        params: { page: currentPage, pageSize: 10 },
      });
      if (response.success && response.data) {
        setTransactions(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        const total = response.data.data.reduce(
          (sum: number, t: Transaction) => sum + (t.status === 'completed' ? t.amount : 0),
          0
        );
        setTotalRevenue(total);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to refund this transaction?')) {
      try {
        await apiClient.post(`/api/payments/${transaction.id}/refund`, {
          amount: transaction.amount,
        });
        setTransactions(
          transactions.map((t) =>
            t.id === transaction.id
              ? { ...t, status: 'refunded' }
              : t
          )
        );
      } catch (error) {
        console.error('Error refunding transaction:', error);
      }
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (value) => value.substring(0, 8),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value, row) => `${row.currency} ${value.toLocaleString()}`,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => (
        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full capitalize">
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
            value === 'completed'
              ? 'bg-green-100 text-green-700'
              : value === 'failed'
              ? 'bg-red-100 text-red-700'
              : value === 'refunded'
              ? 'bg-gray-100 text-gray-700'
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
            <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
            <p className="text-gray-600 mt-1">Transaction history and payment reconciliation</p>
          </div>
          <Button icon={Download}>Export Report</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Transactions</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {transactions.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {transactions.filter((t) => t.status === 'pending').length}
            </p>
          </div>
        </div>

        <DataTable<Transaction>
          columns={columns}
          data={transactions}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          searchPlaceholder="Search transactions..."
          actionColumn={{
            label: 'Actions',
            actions: [
              {
                label: 'View',
                onClick: (row) => {
                  setSelectedTransaction(row);
                  setIsModalOpen(true);
                },
                color: 'blue',
              },
              {
                label: 'Refund',
                onClick: handleRefund,
                color: 'red',
              },
            ],
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Transaction Details"
          size="lg"
        >
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="text-gray-900 font-mono">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-gray-900 capitalize">{selectedTransaction.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-gray-900 font-semibold">
                    {selectedTransaction.currency} {selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900 capitalize">{selectedTransaction.type}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                <p className="text-gray-900 capitalize">{selectedTransaction.paymentMethod}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="text-gray-900">
                  {new Date(selectedTransaction.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedTransaction.stripeTransactionId && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Stripe ID</label>
                  <p className="text-gray-900 font-mono">
                    {selectedTransaction.stripeTransactionId}
                  </p>
                </div>
              )}

              <div className="border-t pt-4 flex gap-3">
                <Button variant="primary">View Invoice</Button>
                {selectedTransaction.status === 'completed' && (
                  <Button
                    variant="danger"
                    onClick={() => handleRefund(selectedTransaction)}
                  >
                    Refund
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

export default PaymentsPage;
