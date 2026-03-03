import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import DataTable, { Column } from '@/components/Common/DataTable';
import Button from '@/components/Common/Button';
import { Property } from '@/types';
import { apiClient } from '@/lib/api';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Common/Modal';

const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [currentPage]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/properties/list', {
        params: { page: currentPage, pageSize: 10 },
      });
      if (response.success && response.data) {
        setProperties(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (property: Property) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await apiClient.delete(`/api/properties/${property.id}`);
        setProperties(properties.filter((p) => p.id !== property.id));
      } catch (error) {
        console.error('Error deleting property:', error);
      }
    }
  };

  const columns: Column<Property>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => `${value.city}, ${value.state}`,
    },
    {
      key: 'price',
      label: 'Price',
      render: (value, row) => `${row.currency} ${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            value === 'available'
              ? 'bg-green-100 text-green-700'
              : value === 'sold'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'views',
      label: 'Views',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Properties Management</h1>
            <p className="text-gray-600 mt-1">Manage all property listings</p>
          </div>
          <Link href="/properties/create">
            <Button icon={Plus}>Add Property</Button>
          </Link>
        </div>

        <DataTable<Property>
          columns={columns}
          data={properties}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          searchPlaceholder="Search properties..."
          actionColumn={{
            label: 'Actions',
            actions: [
              {
                label: 'View',
                onClick: (row) => {
                  setSelectedProperty(row);
                  setIsModalOpen(true);
                },
                color: 'blue',
              },
              {
                label: 'Edit',
                onClick: (row) => {
                  // Handle edit
                },
                color: 'blue',
              },
              {
                label: 'Delete',
                onClick: handleDelete,
                color: 'red',
              },
            ],
          }}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Property Details"
          size="lg"
        >
          {selectedProperty && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-gray-900">{selectedProperty.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{selectedProperty.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                  <p className="text-gray-900">{selectedProperty.bedrooms}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bathrooms</label>
                  <p className="text-gray-900">{selectedProperty.bathrooms}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Price</label>
                <p className="text-gray-900">
                  {selectedProperty.currency} {selectedProperty.price.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default PropertiesPage;
