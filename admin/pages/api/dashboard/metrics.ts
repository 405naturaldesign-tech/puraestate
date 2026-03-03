import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  startOfMonth,
} from 'firebase/firestore';
import { APIResponse, DashboardMetrics } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<DashboardMetrics>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Get total properties
    const propertiesSnapshot = await getDocs(collection(db, 'properties'));
    const totalProperties = propertiesSnapshot.size;

    // Get total users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnapshot.size;

    // Get total bookings
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const totalBookings = bookingsSnapshot.size;

    // Get this month's bookings
    const monthStart = startOfMonth(new Date());
    const monthBookingsQuery = query(
      collection(db, 'bookings'),
      where('createdAt', '>=', monthStart),
      orderBy('createdAt', 'desc')
    );
    const monthBookingsSnapshot = await getDocs(monthBookingsQuery);
    const monthlyBookings = monthBookingsSnapshot.size;

    // Calculate metrics
    let totalRevenue = 0;
    let monthlyRevenue = 0;

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      totalRevenue += booking.totalPrice || 0;
    });

    monthBookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      monthlyRevenue += booking.totalPrice || 0;
    });

    // Get active users
    const activeUsersQuery = query(
      collection(db, 'users'),
      where('isActive', '==', true)
    );
    const activeUsersSnapshot = await getDocs(activeUsersQuery);
    const activeUsers = activeUsersSnapshot.size;

    // Get pending verifications
    const pendingVerificationsQuery = query(
      collection(db, 'agents'),
      where('verified', '==', false)
    );
    const pendingVerificationsSnapshot = await getDocs(pendingVerificationsQuery);
    const pendingVerifications = pendingVerificationsSnapshot.size;

    const metrics: DashboardMetrics = {
      totalProperties,
      totalUsers,
      totalBookings,
      totalRevenue,
      monthlyBookings,
      monthlyRevenue,
      activeUsers,
      pendingVerifications,
    };

    return res.status(200).json({
      success: true,
      message: 'Metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
