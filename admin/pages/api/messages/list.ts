import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { APIResponse, PaginatedResponse, Message } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<PaginatedResponse<Message>>>
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

    const snapshot = await getDocs(collection(db, 'messages'));
    const allMessages = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Message[];

    const total = allMessages.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedData = allMessages.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
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
    console.error('Error fetching messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
