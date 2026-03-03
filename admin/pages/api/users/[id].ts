import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { APIResponse, User } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse<User>>
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (req.method === 'GET') {
      const docRef = doc(db, 'users', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          ...docSnap.data(),
          id: docSnap.id,
        } as User,
        timestamp: new Date().toISOString(),
      });
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...req.body,
        updatedAt: new Date(),
      });

      const updatedDoc = await getDoc(docRef);
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: {
          ...updatedDoc.data(),
          id: updatedDoc.id,
        } as User,
        timestamp: new Date().toISOString(),
      });
    } else if (req.method === 'DELETE') {
      await deleteDoc(doc(db, 'users', id));
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
