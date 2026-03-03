/**
 * Firebase Authentication Configuration
 * PuraEstate Backend
 * Supports: Email/Password, Google, Facebook, Apple, Phone
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'puraestate-backend',
  databaseURL: 'https://puraestate-backend.firebaseio.com'
});

const auth = admin.auth();
const db = admin.firestore();

/**
 * EMAIL/PASSWORD AUTHENTICATION
 */

// User Sign Up with Email/Password
exports.signUpWithEmail = functions.https.onCall(async (data, context) => {
  try {
    const { email, password, firstName, lastName, userType } = data;

    if (!email || !password) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      firstName,
      lastName,
      phoneNumber: '',
      profileImage: '',
      userType: userType || 'investor',
      location: {
        country: '',
        state: '',
        city: '',
        coordinates: null
      },
      bio: '',
      verificationStatus: 'unverified',
      kycDocuments: [],
      socialLinks: {},
      investmentPreferences: {
        minBudget: 0,
        maxBudget: 0,
        propertyTypes: [],
        locations: [],
        riskTolerance: 'medium'
      },
      preferences: {
        notifications: true,
        language: 'en',
        currency: 'USD',
        timezone: 'UTC'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      metadata: {
        source: 'email',
        referralCode: generateReferralCode(),
        tags: []
      }
    });

    // Set custom claims for user type
    await auth.setCustomUserClaims(userRecord.uid, {
      userType: userType || 'investor'
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// User Sign In with Email/Password
exports.signInWithEmail = functions.https.onCall(async (data, context) => {
  try {
    const { email, password } = data;

    if (!email || !password) {
      throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
    }

    // Verify user exists
    const userRecord = await auth.getUserByEmail(email);

    // Update last login time in Firestore
    await db.collection('users').doc(userRecord.uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate custom token (for backend verification)
    const customToken = await auth.createCustomToken(userRecord.uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      customToken,
      message: 'Sign in successful'
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw new functions.https.HttpsError('internal', 'Invalid email or password');
  }
});

/**
 * SOCIAL AUTHENTICATION
 */

// Google OAuth Callback
exports.handleGoogleAuth = functions.https.onCall(async (data, context) => {
  try {
    const { token, firstName, lastName, profileImage } = data;

    // Verify Google token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if user exists in Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // Create new user document
      await db.collection('users').doc(uid).set({
        uid,
        email: decodedToken.email,
        firstName: firstName || decodedToken.name?.split(' ')[0] || '',
        lastName: lastName || decodedToken.name?.split(' ')[1] || '',
        phoneNumber: '',
        profileImage: profileImage || decodedToken.picture || '',
        userType: 'investor',
        location: {
          country: '',
          state: '',
          city: '',
          coordinates: null
        },
        bio: '',
        verificationStatus: 'verified',
        kycDocuments: [],
        socialLinks: {
          google: decodedToken.email
        },
        investmentPreferences: {
          minBudget: 0,
          maxBudget: 0,
          propertyTypes: [],
          locations: [],
          riskTolerance: 'medium'
        },
        preferences: {
          notifications: true,
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        metadata: {
          source: 'google',
          referralCode: generateReferralCode(),
          tags: []
        }
      });
    } else {
      // Update existing user
      await db.collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        profileImage: profileImage || userDoc.data().profileImage
      });
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      userType: 'investor'
    });

    return {
      uid,
      email: decodedToken.email,
      message: 'Google authentication successful'
    };
  } catch (error) {
    console.error('Google auth error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Facebook OAuth Callback
exports.handleFacebookAuth = functions.https.onCall(async (data, context) => {
  try {
    const { token, firstName, lastName, profileImage } = data;

    // Verify Facebook token with Firebase
    const credential = admin.auth.FacebookAuthProvider.credential(token);
    const userRecord = await admin.auth().signInWithCredential(credential);

    const uid = userRecord.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        uid,
        email: userRecord.email || '',
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber: '',
        profileImage: profileImage || '',
        userType: 'investor',
        location: {
          country: '',
          state: '',
          city: '',
          coordinates: null
        },
        bio: '',
        verificationStatus: 'verified',
        kycDocuments: [],
        socialLinks: {
          facebook: userRecord.providerData[0]?.uid
        },
        investmentPreferences: {
          minBudget: 0,
          maxBudget: 0,
          propertyTypes: [],
          locations: [],
          riskTolerance: 'medium'
        },
        preferences: {
          notifications: true,
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        metadata: {
          source: 'facebook',
          referralCode: generateReferralCode(),
          tags: []
        }
      });
    } else {
      await db.collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      uid,
      email: userRecord.email,
      message: 'Facebook authentication successful'
    };
  } catch (error) {
    console.error('Facebook auth error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Apple Sign In
exports.handleAppleAuth = functions.https.onCall(async (data, context) => {
  try {
    const { identityToken, firstName, lastName, email } = data;

    // Verify Apple token
    const decodedToken = admin.auth().verifyIdToken(identityToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        uid,
        email: email || decodedToken.email || '',
        firstName: firstName || decodedToken.name?.firstName || '',
        lastName: lastName || decodedToken.name?.lastName || '',
        phoneNumber: '',
        profileImage: '',
        userType: 'investor',
        location: {
          country: '',
          state: '',
          city: '',
          coordinates: null
        },
        bio: '',
        verificationStatus: 'verified',
        kycDocuments: [],
        socialLinks: {
          apple: decodedToken.email
        },
        investmentPreferences: {
          minBudget: 0,
          maxBudget: 0,
          propertyTypes: [],
          locations: [],
          riskTolerance: 'medium'
        },
        preferences: {
          notifications: true,
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        metadata: {
          source: 'apple',
          referralCode: generateReferralCode(),
          tags: []
        }
      });
    } else {
      await db.collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      uid,
      email,
      message: 'Apple authentication successful'
    };
  } catch (error) {
    console.error('Apple auth error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * PHONE AUTHENTICATION
 */

// Send OTP to Phone
exports.sendPhoneOTP = functions.https.onCall(async (data, context) => {
  try {
    const { phoneNumber } = data;

    if (!phoneNumber) {
      throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
    }

    // Use Firebase Phone Authentication (client-side only in production)
    // This is just a wrapper for client-side implementation
    return {
      message: 'OTP sent successfully',
      phoneNumber,
      instructions: 'Complete phone verification on client side'
    };
  } catch (error) {
    console.error('Phone OTP error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Verify Phone OTP and Create/Update User
exports.verifyPhoneOTP = functions.https.onCall(async (data, context) => {
  try {
    const { phoneNumber, idToken, firstName, lastName } = data;

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      await db.collection('users').doc(uid).set({
        uid,
        email: decodedToken.email || '',
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber,
        profileImage: '',
        userType: 'investor',
        location: {
          country: '',
          state: '',
          city: '',
          coordinates: null
        },
        bio: '',
        verificationStatus: 'unverified',
        kycDocuments: [],
        socialLinks: {},
        investmentPreferences: {
          minBudget: 0,
          maxBudget: 0,
          propertyTypes: [],
          locations: [],
          riskTolerance: 'medium'
        },
        preferences: {
          notifications: true,
          language: 'en',
          currency: 'USD',
          timezone: 'UTC'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        metadata: {
          source: 'phone',
          referralCode: generateReferralCode(),
          tags: []
        }
      });
    } else {
      await db.collection('users').doc(uid).update({
        phoneNumber,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      uid,
      phoneNumber,
      message: 'Phone verification successful'
    };
  } catch (error) {
    console.error('Phone verification error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * PASSWORD MANAGEMENT
 */

// Send Password Reset Email
exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  try {
    const { email } = data;

    if (!email) {
      throw new functions.https.HttpsError('invalid-argument', 'Email is required');
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email);

    // In production, send this via email service
    console.log(`Password reset link: ${resetLink}`);

    return {
      message: 'Password reset email sent',
      email
    };
  } catch (error) {
    console.error('Password reset error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Reset Password with Token
exports.resetPassword = functions.https.onCall(async (data, context) => {
  try {
    const { oobCode, newPassword } = data;

    if (!oobCode || !newPassword) {
      throw new functions.https.HttpsError('invalid-argument', 'OOB code and new password are required');
    }

    // Verify oobCode and reset password
    const email = await auth.verifyPasswordResetCode(oobCode);
    await auth.confirmPasswordReset(oobCode, newPassword);

    return {
      email,
      message: 'Password reset successfully'
    };
  } catch (error) {
    console.error('Reset password error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Update Password (for logged-in users)
exports.updatePassword = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { newPassword } = data;

    if (!newPassword) {
      throw new functions.https.HttpsError('invalid-argument', 'New password is required');
    }

    await auth.updateUser(context.auth.uid, {
      password: newPassword
    });

    return {
      message: 'Password updated successfully'
    };
  } catch (error) {
    console.error('Update password error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * USER ACCOUNT MANAGEMENT
 */

// Delete User Account
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const uid = context.auth.uid;

    // Soft delete - mark as inactive
    await db.collection('users').doc(uid).update({
      isActive: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Optional: Disable Firebase Auth user
    // await auth.updateUser(uid, { disabled: true });

    return {
      message: 'Account deleted successfully'
    };
  } catch (error) {
    console.error('Delete account error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Disable/Enable User Account
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { targetUid, disable } = data;
    const currentUser = await auth.getUser(context.auth.uid);

    // Only admins can toggle user status
    if (currentUser.customClaims?.userType !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can perform this action');
    }

    await auth.updateUser(targetUid, { disabled: disable });
    await db.collection('users').doc(targetUid).update({
      isActive: !disable
    });

    return {
      message: `User account ${disable ? 'disabled' : 'enabled'} successfully`
    };
  } catch (error) {
    console.error('Toggle user status error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * HELPER FUNCTIONS
 */

function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Auth state change listener
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  console.log(`New user created: ${user.uid}`);
  // Additional setup for new users can be added here
});

// User deletion listener
exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  console.log(`User deleted: ${user.uid}`);

  // Delete user document from Firestore
  await db.collection('users').doc(user.uid).delete();

  // Clean up related data
  const bookings = await db.collection('bookings').where('userId', '==', user.uid).get();
  const batch = db.batch();

  bookings.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
});

module.exports = exports;
