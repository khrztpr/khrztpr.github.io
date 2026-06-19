const authFunctions = require('firebase-functions/v1/auth');
const admin = require('firebase-admin');
admin.initializeApp();

exports.processSignUp = authFunctions.user().onCreate(async (user) => {
  const db = admin.firestore();
  return db.collection('users').doc(user.uid).set({
    email: user.email || null,
    role: 'employee',
    area: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
