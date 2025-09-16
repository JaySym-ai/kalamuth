import * as functions from 'firebase-functions/v1';
import { db } from './admin.js';
// Delete Firestore user document when Auth user is deleted (Gen1)
// Keep as 1st-gen because basic Auth triggers are not supported in v2.
export const cleanupUserDocOnAuthDelete = functions
    .region('us-central1')
    .runWith({ memory: '256MB', timeoutSeconds: 540 })
    .auth.user()
    .onDelete(async (user) => {
    const uid = user.uid;
    try {
        await db.collection('users').doc(uid).delete();
        console.log(`Deleted Firestore user doc for uid=${uid}`);
    }
    catch (err) {
        console.error(`Failed to delete Firestore user doc for uid=${uid}:`, err);
        // Do not throw to avoid retry storms unless you specifically want retries
    }
});
