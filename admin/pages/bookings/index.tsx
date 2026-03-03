import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DataTable, { Column } from '@/components/Common/DataTable';
import { Booking } from '@/types';
import { apiClient } from '@/lib/api';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/bookings/list', {
        params: { page: currentPage, pageSize: 10 },
      });
      if (response.success && response.data) {
        setBookings(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (booking: Booking, newStatus: string) => {
    try {
      await apiClient.put(`/api/bookings/${booking.id}`, {
        status: newStatus,
      });
      setBookings(
        bookings.map((b) =>
          b.id === booking.id ? { ...b, status: newStatus as any } : b
        )
      );
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await handleStatusChange(booking, 'cancelled');
    }
  };

  const columns: Column<Booking>[] = [
    {
      key: 'id',
      label: 'Booking ID',
      render: (value) => value.substring(0, 8),
    },
    {
      key: 'propertyId',
      label: 'Property',
      render: (value) => `Property ${value.substring(0, 8)}`,
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'totalPrice',
      label: 'Total Price',
      render: (value) => `$${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            value === 'completed'
              ? 'bg-green-100 text-green-700'
              : value === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : value === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 mt-1">View and manage all bookings</p>
        </div>

        <DataTable<Booking>
          columns={columns}
          data={bookings}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          searchPlaceholder="Search bookings..."
          actionColumn={{
            label: 'Actions',
            actions: [
              {
                label: 'View',
                onClick: (row) => {
                  setSelectedBooking(row);
                  setIsModalOpen(true);
                },
                color: 'blue',
              },
              {
                label: 'Cancel',
                onClick: handleCancel,
                color: 'red',
              },
            ],
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Booking Details"
          size="lg"
        >
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Booking ID</label>
                  <p className="text-gray-900 font-mono">{selectedBooking.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-gray-900 capitalize">{selectedBooking.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Check-in</label>
                  <p className="text-gray-900">
                    {new Date(selectedBooking.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Check-out</label>
                  <p className="text-gray-900">
                    {new Date(selectedBooking.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Price</label>
                  <p className="text-gray-900 font-semibold">
                    ${selectedBooking.totalPrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Commission</label>
                  <p className="text-gray-900 font-semibold">
                    ${selectedBooking.commission.toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 flex gap-3">
                <Button variant="primary">Edit</Button>
                {selectedBooking.status !== 'cancelled' && (
                  <>
                    <Button
                      variant="success"
                      onClick={() =>
                        handleStatusChange(selectedBooking, 'confirmed')
                      }
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleCancel(selectedBooking)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default BookingsPage;
