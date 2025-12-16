import { db, storage } from './firebase';
import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const COLLECTION_NAME = 'workers';

/**
 * Adds a new worker to the system.
 * @param {string} name 
 * @param {string} role 
 * @param {File} photoFile 
 */
export const addWorker = async (name, role, photoFile) => {
    try {
        // 1. Upload Reference Photo
        const filename = `workers/${Date.now()}_${photoFile.name}`;
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, photoFile);
        const referencePhotoUrl = await getDownloadURL(snapshot.ref);

        // 2. Save to Firestore
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            name,
            role,
            referencePhotoUrl,
            createdAt: serverTimestamp()
        });

        return { id: docRef.id, name, role, referencePhotoUrl };
    } catch (error) {
        console.error("Error adding worker:", error);
        throw error;
    }
};

/**
 * Fetches all workers from Firestore.
 */
export const getWorkers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const workers = [];
        querySnapshot.forEach((doc) => {
            workers.push({ id: doc.id, ...doc.data() });
        });
        return workers;
    } catch (error) {
        console.error("Error getting workers:", error);
        throw error;
    }
};

/**
 * Deletes a worker from Firestore.
 * @param {string} workerId 
 */
export const deleteWorker = async (workerId) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, workerId));
        // Note: We are not deleting the photo from Storage to keep this simple, 
        // but in a production app we should.
        return true;
    } catch (error) {
        console.error("Error deleting worker:", error);
        throw error;
    }
};
