import React, { useState } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import Button from '@/components/Common/Button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, FileText } from 'lucide-react';
import Modal from '@/components/Common/Modal';

const AnalyticsPage: React.FC = () => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState('user_metrics');

  const userMetricsData = [
    { month: 'Jan', users: 1200, activeUsers: 850 },
    { month: 'Feb', users: 1400, activeUsers: 920 },
    { month: 'Mar', users: 1600, activeUsers: 1050 },
    { month: 'Apr', users: 1900, activeUsers: 1200 },
    { month: 'May', users: 2100, activeUsers: 1350 },
    { month: 'Jun', users: 2300, activeUsers: 1450 },
  ];

  const propertyPerformanceData = [
    { type: 'Apartment', views: 4000, bookings: 120 },
    { type: 'House', views: 3000, bookings: 98 },
    { type: 'Villa', views: 2000, bookings: 67 },
    { type: 'Commercial', views: 1500, bookings: 42 },
    { type: 'Land', views: 1000, bookings: 28 },
  ];

  const revenueData = [
    { week: 'Week 1', revenue: 45000, commissions: 5400 },
    { week: 'Week 2', revenue: 52000, commissions: 6240 },
    { week: 'Week 3', revenue: 48000, commissions: 5760 },
    { week: 'Week 4', revenue: 61000, commissions: 7320 },
  ];

  const agentPerformanceData = [
    { name: 'Agent A', bookings: 45, revenue: 125000, rating: 4.8 },
    { name: 'Agent B', bookings: 38, revenue: 98000, rating: 4.6 },
    { name: 'Agent C', bookings: 52, revenue: 145000, rating: 4.9 },
    { name: 'Agent D', bookings: 31, revenue: 82000, rating: 4.4 },
    { name: 'Agent E', bookings: 43, revenue: 115000, rating: 4.7 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive platform analytics and insights</p>
          </div>
          <Button
            icon={Download}
            onClick={() => setIsReportModalOpen(true)}
          >
            Generate Report
          </Button>
        </div>

        {/* User Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ fill: '#6366F1' }}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Property Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={propertyPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#6366F1" />
              <Bar dataKey="bookings" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="commissions"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Agent Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Agent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bookings</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformanceData.map((agent, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700">{agent.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{agent.bookings}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      ${agent.revenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-yellow-500 font-semibold">{agent.rating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Report Modal */}
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Generate Report"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="user_metrics">User Metrics</option>
                <option value="property_performance">Property Performance</option>
                <option value="revenue">Revenue Report</option>
                <option value="agent_performance">Agent Performance</option>
                <option value="custom">Custom Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </div>

            <div className="flex gap-3 border-t pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button icon={FileText}>Generate</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;
