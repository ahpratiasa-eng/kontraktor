import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, appId } from '../lib/firebase';

/**
 * Upload an image to Firebase Storage and return the download URL
 * @param base64Data - Base64 encoded image string
 * @param path - Storage path (e.g., 'projects/abc123/gallery')
 * @param filename - Filename for the image
 * @returns Download URL of the uploaded image
 */
export const uploadImage = async (
    base64Data: string,
    path: string,
    filename: string
): Promise<string> => {
    try {
        // Convert base64 to blob
        const base64Response = await fetch(base64Data);
        const blob = await base64Response.blob();

        // Create storage reference
        const storageRef = ref(storage, `${appId}/${path}/${filename}`);

        // Upload
        await uploadBytes(storageRef, blob);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Upload attendance evidence photo
 * @param base64Data - Base64 image
 * @param projectId - Project ID
 * @param date - Date string (YYYY-MM-DD)
 * @returns Download URL
 */
export const uploadAttendancePhoto = async (
    base64Data: string,
    projectId: string,
    date: string
): Promise<string> => {
    const filename = `attendance_${date}_${Date.now()}.webp`;
    return uploadImage(base64Data, `projects/${projectId}/attendance`, filename);
};

/**
 * Upload gallery photo
 * @param base64Data - Base64 image
 * @param projectId - Project ID
 * @returns Download URL
 */
export const uploadGalleryPhoto = async (
    base64Data: string,
    projectId: string
): Promise<string> => {
    const filename = `gallery_${Date.now()}.webp`;
    return uploadImage(base64Data, `projects/${projectId}/gallery`, filename);
};

/**
 * Delete an image from Firebase Storage
 * @param url - Full download URL of the image
 */
export const deleteImage = async (url: string): Promise<void> => {
    try {
        // Extract path from URL
        const decodedUrl = decodeURIComponent(url);
        const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
        if (!pathMatch) {
            console.warn('Could not extract path from URL:', url);
            return;
        }

        const storagePath = pathMatch[1];
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Error deleting image:', error);
        // Don't throw - deletion failure shouldn't break the app
    }
};

/**
 * Check if a string is a base64 image (vs a URL)
 */
export const isBase64Image = (str: string): boolean => {
    return str.startsWith('data:image/');
};

/**
 * Check if a string is a Firebase Storage URL
 */
export const isStorageUrl = (str: string): boolean => {
    return str.includes('firebasestorage.googleapis.com') ||
        str.includes('firebasestorage.app');
};
