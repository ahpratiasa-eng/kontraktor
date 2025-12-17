import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, appId } from '../lib/firebase';

/**
 * Transform Google Drive URL to a format that can be displayed in <img> tags
 * Handles various GDrive URL formats and converts to lh3.googleusercontent.com format
 */
export const transformGDriveUrl = (url: string): string => {
    if (!url) return url;

    // Already transformed or not a GDrive URL
    if (url.includes('lh3.googleusercontent.com')) return url;
    if (!url.includes('drive.google.com') && !url.includes('googleusercontent')) return url;

    // Extract file ID from various Google Drive URL formats
    let fileId = '';

    // Format: https://drive.google.com/uc?id=FILE_ID
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID
    const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (ucMatch) {
        fileId = ucMatch[1];
    }

    // Format: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        fileId = fileMatch[1];
    }

    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
        fileId = openMatch[1];
    }

    if (fileId) {
        // Use lh3.googleusercontent.com format which works reliably for <img>
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Fallback: return original
    return url;
};

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
 * Helper to get GDrive Script URL from LocalStorage or Hardcoded Default
 */
const getGDriveScript = () => {
    // 1. Cek LocalStorage (kalau user mau override sendiri)
    if (typeof window !== 'undefined') {
        const local = localStorage.getItem('gdrive_script_url');
        if (local) return local;
    }
    // 2. Default URL (Hardcoded)
    return "https://script.google.com/macros/s/AKfycbzW5GGFcLLl7KPC-mYkF6L4pC1_K89QjJAemj8c6Jpo3nL_DeM-YgZFsm1PefA9NfbY/exec";
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
    const scriptUrl = getGDriveScript();
    const filename = `attendance_${date}_${Date.now()}.webp`;

    if (scriptUrl) {
        return uploadToGoogleDrive(base64Data, scriptUrl, filename);
    }
    return uploadImage(base64Data, `projects/${projectId}/attendance`, filename);
};

/**
 * Upload gallery photo
 * @param base64Data - Base64 image
 * @param projectId - Project ID
 * @returns Download URL
 */
/**
 * Upload to Google Drive via Apps Script Web App
 */
export const uploadToGoogleDrive = async (
    base64Data: string,
    scriptUrl: string,
    filename: string
): Promise<string> => {
    try {
        const res = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify({ image: base64Data, name: filename })
        });

        const json = await res.json();
        if (json.status === 'success') {
            return json.url;
        } else {
            throw new Error(json.message || 'Upload failed');
        }
    } catch (e) {
        console.error("GDrive upload error:", e);
        throw e;
    }
};

/**
 * Upload gallery photo
 * @param base64Data - Base64 image
 * @param projectId - Project ID
 * @param gDriveUrl - Optional: Google Apps Script URL
 * @returns Download URL
 */
export const uploadGalleryPhoto = async (
    base64Data: string,
    projectId: string,
    gDriveUrl?: string
): Promise<string> => {
    const scriptUrl = gDriveUrl || getGDriveScript();
    const filename = `gallery_${projectId}_${Date.now()}.webp`;

    if (scriptUrl) {
        return uploadToGoogleDrive(base64Data, scriptUrl, filename);
    }
    const filenameFb = `gallery_${Date.now()}.webp`;
    return uploadImage(base64Data, `projects/${projectId}/gallery`, filenameFb);
};

/**
 * Upload portfolio photo for landing page
 * @param base64Data - Base64 image
 * @returns Download URL
 */
export const uploadPortfolioPhoto = async (
    base64Data: string
): Promise<string> => {
    const scriptUrl = getGDriveScript();
    const filename = `portfolio_${Date.now()}.webp`;

    if (scriptUrl) {
        return uploadToGoogleDrive(base64Data, scriptUrl, filename);
    }
    return uploadImage(base64Data, `landing/portfolio`, filename);
};

/**
 * Upload general project document (PDF, DOCX, etc)
 * @param base64Data - Base64 data string (must include data:application/pdf;base64, etc)
 * @param projectId - Project ID
 * @param originalName - Original filename
 * @returns Download URL
 */
export const uploadProjectDocument = async (
    base64Data: string,
    projectId: string,
    originalName: string
): Promise<string> => {
    const scriptUrl = getGDriveScript();
    // Sanitize filename and append timestamp
    const ext = originalName.split('.').pop();
    const cleanName = originalName.replace(/[^a-zA-Z0-9]/g, '_').replace(`_${ext}`, '');
    const filename = `doc_${projectId}_${cleanName}_${Date.now()}.${ext}`;

    if (scriptUrl) {
        return uploadToGoogleDrive(base64Data, scriptUrl, filename);
    }

    // Fallback to firebase storage if script not available (though GDrive is preferred for docs)
    return uploadImage(base64Data, `projects/${projectId}/documents`, filename);
};

/**
 * Upload project cover photo
 * @param base64Data - Base64 image
 * @param projectId - Project ID (optional, will use timestamp if not provided)
 * @returns Download URL
 */
export const uploadProjectCover = async (
    base64Data: string,
    projectId?: string
): Promise<string> => {
    const scriptUrl = getGDriveScript();
    const filename = `cover_${projectId || 'new'}_${Date.now()}.webp`;

    if (scriptUrl) {
        return uploadToGoogleDrive(base64Data, scriptUrl, filename);
    }
    return uploadImage(base64Data, `projects/${projectId || 'new'}/cover`, filename);
};

/**
 * Delete an image from Firebase Storage
 * @param url - Full download URL of the image
 */
export const deleteImage = async (url: string): Promise<void> => {
    // If it's a drive link, we can't delete it easily via client without more permissions
    if (url.includes('drive.google.com') || url.includes('googleusercontent')) return;

    try {
        // Extract path from URL
        const decodedUrl = decodeURIComponent(url);
        const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
        if (!pathMatch) {
            // console.warn('Could not extract path from URL:', url);
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
 * Check if a string is a Firebase Storage URL or Drive URL
 */
export const isStorageUrl = (str: string): boolean => {
    return str.includes('firebasestorage.googleapis.com') ||
        str.includes('firebasestorage.app') ||
        str.includes('drive.google.com') ||
        str.includes('googleusercontent.com');
};
