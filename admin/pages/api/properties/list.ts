import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit, offset } from 'firebase/firestore';
import { APIResponse, PaginatedResponse, Property } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<PaginatedResponse<Property>>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;

    let q = collection(db, 'properties');

    if (status) {
      q = collection(db, 'properties');
      // Note: Firestore query limitations - you may need pagination library
    }

    const snapshot = await getDocs(q);
    const allProperties = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Property[];

    const total = allProperties.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedData = allProperties.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      success: true,
      message: 'Properties retrieved successfully',
      data: {
        data: paginatedData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
