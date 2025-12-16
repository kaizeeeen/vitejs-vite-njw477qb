import { db, storage } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, getBytes } from 'firebase/storage';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "dummy_key");
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" } 
});

/**
 * Converts a Blob to a GoogleGenerativeAI compatible Part.
 * @param {Blob} blob 
 * @returns {Promise<Object>}
 */
const blobToGenerativePart = async (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64data,
                    mimeType: blob.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Verifies identity by comparing the current camera frame with the reference photo.
 * @param {string} referencePhotoUrl 
 * @param {Blob} currentImageBlob 
 * @returns {Promise<{match: boolean}>}
 */
export const verifyIdentity = async (referencePhotoUrl, currentImageBlob) => {
    try {
        console.log("Fetching reference photo via Weserv Proxy:", referencePhotoUrl);
        
        // 1. Prepare unique URL for cache busting
        // Appending a timestamp to the source URL forces Weserv to treat it as a new resource
        const separator = referencePhotoUrl.includes('?') ? '&' : '?';
        const uniqueSourceUrl = `${referencePhotoUrl}${separator}t=${Date.now()}`;
        
        // 2. Encode for Weserv
        // Remove https:// protocol for shorter URLs if preferred, or just encode the whole thing.
        // Weserv accepts encoded full URLs.
        const encodedUrl = encodeURIComponent(uniqueSourceUrl);
        
        // 3. Construct Proxy URL
        // maxage=1h: Sets Cache-Control to 1 hour (User Requirement)
        // output=jpg: Ensures consistent format
        const proxyUrl = `https://images.weserv.nl/?url=${encodedUrl}&maxage=1h&output=jpg`;
        
        // 4. Fetch with No-Cache
        const response = await fetch(proxyUrl, {
            cache: 'no-store', // Prevent browser caching
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.error("Proxy Fetch Error Status:", response.status);
            throw new Error(`Failed to fetch reference photo via proxy: ${response.status} ${response.statusText}`);
        }
        
        const referenceBlob = await response.blob();

        // 5. Convert Reference Blob to Base64 (Inline Data)
        const referencePart = await blobToGenerativePart(referenceBlob);

        // 6. Convert Current Frame Blob to Base64 (Inline Data)
        const currentPart = await blobToGenerativePart(currentImageBlob);

        // 7. Send both Base64 parts to Gemini
        const prompt = `Compare these two images. Strictly confirm if they are the same person. 
        The first image is the reference, the second is the current capture.
        Return JSON: { "match": boolean }`;
        
        const result = await model.generateContent([prompt, referencePart, currentPart]);
        const responseText = await result.response.text();
        
        console.log("Gemini Verification Response:", responseText);
        
        // Parse JSON
        const jsonStr = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const jsonResponse = JSON.parse(jsonStr);
        
        return jsonResponse;

    } catch (error) {
        console.error("Identity Verification Error:", error);
        throw error;
    }
};

/**
 * Records attendance in Firestore.
 * @param {string} workerId 
 * @param {string} workerName 
 * @param {object} location 
 * @param {string} method - 'Face Scan' or 'MANUAL_OVERRIDE'
 */
export const recordAttendance = async (workerId, workerName, location, method = 'Face Scan') => {
  try {
    await addDoc(collection(db, 'attendance'), {
      workerId,
      workerName,
      timestamp: serverTimestamp(),
      location: {
        lat: location?.latitude || null,
        lng: location?.longitude || null
      },
      method, // 'Face Scan' or 'MANUAL_OVERRIDE'
      userAgent: navigator.userAgent,
      verified: true
    });

    console.log("Attendance recorded successfully via", method);
    return true;
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
};

/**
 * Fetches attendance history with optional filters.
 */
export const getAttendanceHistory = async () => {
    try {
        const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const records = [];
        querySnapshot.forEach((doc) => {
            records.push({ id: doc.id, ...doc.data() });
        });
        return records;
    } catch (error) {
        console.error("Error fetching attendance history:", error);
        throw error;
    }
};

/**
 * Deletes an attendance record from Firestore.
 * @param {string} recordId 
 */
export const deleteAttendanceRecord = async (recordId) => {
    try {
        await deleteDoc(doc(db, 'attendance', recordId));
        return true;
    } catch (error) {
        console.error("Error deleting attendance record:", error);
        throw error;
    }
};
