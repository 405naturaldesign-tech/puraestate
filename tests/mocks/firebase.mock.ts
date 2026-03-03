export const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  updateEmail: jest.fn(),
  updatePassword: jest.fn(),
  getCurrentUser: jest.fn(),
};

export const mockFirestore = {
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }),
    add: jest.fn(),
    where: jest.fn().mockReturnValue({
      get: jest.fn(),
    }),
    orderBy: jest.fn().mockReturnValue({
      get: jest.fn(),
    }),
    limit: jest.fn().mockReturnValue({
      get: jest.fn(),
    }),
  }),
};

export const mockFirebaseStorage = {
  ref: jest.fn().mockReturnValue({
    child: jest.fn().mockReturnValue({
      put: jest.fn(),
      delete: jest.fn(),
      getDownloadURL: jest.fn(),
    }),
  }),
};

export const mockFirebaseRealtime = {
  ref: jest.fn().mockReturnValue({
    set: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  }),
};

export const createMockFirebaseApp = () => ({
  auth: mockFirebaseAuth,
  firestore: mockFirestore,
  storage: mockFirebaseStorage,
  realtime: mockFirebaseRealtime,
});

export const mockUser = {
  uid: 'user-123',
  email: 'user@example.com',
  emailVerified: true,
  displayName: 'John Doe',
  photoURL: null,
  phoneNumber: '+1234567890',
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
};

export const mockAuthError = {
  code: 'auth/invalid-email',
  message: 'The email address is badly formatted.',
};

export const mockFirestoreDoc = {
  id: 'doc-123',
  data: () => ({
    name: 'John Doe',
    email: 'user@example.com',
    role: 'investor',
  }),
  exists: true,
};
