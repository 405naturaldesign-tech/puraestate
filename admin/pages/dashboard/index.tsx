import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import StatCard from '@/components/Common/StatCard';
import RevenueChart from '@/components/Charts/RevenueChart';
import PropertyChart from '@/components/Charts/PropertyChart';
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { DashboardMetrics } from '@/types';
import { useDashboardStore } from '@/stores/dashboardStore';

const DashboardPage: React.FC = () => {
  const { metrics, setMetrics, isLoading, setLoading } = useDashboardStore();
  const [chartData] = useState([
    { name: 'Jan', revenue: 45000, bookings: 12 },
    { name: 'Feb', revenue: 52000, bookings: 15 },
    { name: 'Mar', revenue: 48000, bookings: 14 },
    { name: 'Apr', revenue: 61000, bookings: 18 },
    { name: 'May', revenue: 55000, bookings: 16 },
    { name: 'Jun', revenue: 67000, bookings: 20 },
  ]);

  const [propertyData] = useState([
    { name: 'Apartments', value: 120 },
    { name: 'Houses', value: 85 },
    { name: 'Villas', value: 45 },
    { name: 'Commercial', value: 30 },
    { name: 'Land', value: 25 },
  ]);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<DashboardMetrics>('/api/dashboard/metrics');
        if (response.success && response.data) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [setMetrics, setLoading]);

  if (!metrics) {
    return (
      <AdminLayout>
        <div className="text-center py-12">Loading dashboard...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back to PuraEstate Admin</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Properties"
            value={metrics.totalProperties}
            icon={Building2}
            color="blue"
          />
          <StatCard
            label="Total Users"
            value={metrics.totalUsers}
            icon={Users}
            color="green"
          />
          <StatCard
            label="Monthly Bookings"
            value={metrics.monthlyBookings}
            icon={Calendar}
            trend={12}
            color="purple"
          />
          <StatCard
            label="Total Revenue"
            value={`$${(metrics.totalRevenue / 1000).toFixed(1)}k`}
            icon={CreditCard}
            color="red"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard
            label="Active Users"
            value={metrics.activeUsers}
            icon={Users}
            color="green"
          />
          <StatCard
            label="Pending Verifications"
            value={metrics.pendingVerifications}
            icon={TrendingUp}
            color="red"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={chartData} />
          <PropertyChart data={propertyData} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">New booking created</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
