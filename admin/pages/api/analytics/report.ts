import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { APIResponse, ReportData } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<ReportData>>
) {
  if (req.method === 'POST') {
    try {
      const { type, filters } = req.body;

      let data: any = {};

      if (type === 'user_metrics') {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        data = {
          totalUsers: usersSnapshot.size,
          byRole: {},
          monthlyGrowth: [],
        };
      } else if (type === 'property_performance') {
        const propertiesSnapshot = await getDocs(collection(db, 'properties'));
        data = {
          totalProperties: propertiesSnapshot.size,
          byType: {},
          topProperties: [],
        };
      } else if (type === 'revenue') {
        const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
        let totalRevenue = 0;
        transactionsSnapshot.forEach((doc) => {
          const transaction = doc.data();
          totalRevenue += transaction.amount || 0;
        });
        data = {
          totalRevenue,
          byMonth: [],
          bySource: {},
        };
      } else if (type === 'agent_performance') {
        const agentsSnapshot = await getDocs(collection(db, 'agents'));
        data = {
          totalAgents: agentsSnapshot.size,
          topAgents: [],
          byRating: {},
        };
      }

      const report: ReportData = {
        id: `report_${Date.now()}`,
        title: `${type} Report`,
        type: type as any,
        generatedBy: 'admin',
        generatedAt: new Date(),
        data,
        filters,
      };

      return res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    timestamp: new Date().toISOString(),
  });
}
