import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

try {
    admin.initializeApp();
} catch (e) { }

export const createChat = functions.firestore.document('chats/{id}').onCreate(async (snap, context) => {

    const data = snap.data();
    let to: any = null;

    for (const key in data) {
        if (key !== data.from && key.length > 7) {
            to = key;
        }
    }

    const sender = admin.app().firestore().collection('profile').doc(data!.from);
    const ref = admin.app().firestore().collection('profile').doc(to);
    const senderProfile = await sender.get();

    ref.get().then((res) => {
        const profile = res.data();

        if (profile!.token) {
            const payload = {
                notification: {
                    title: senderProfile!.data()!.displayName,
                    body: data!.message
                }
            };

            admin.messaging().sendToDevice(profile!.token, payload).then(() => {
                // test
                console.log('send');
            }).catch((err) => {
                // 
                console.log('push', err);
            });
        }

    }).catch(err => {
        console.log('profile', err);
    });
});
