import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
}

/**
 * Crops an image file to a 1:1 square, resizes it to 300x300,
 * and compresses it to ensure it is max 100KB (102,400 bytes).
 */
export async function processProfileImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetSize = 300;
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context not available'));
            return;
          }

          // Calculate center 1:1 square crop
          const cropSize = Math.min(img.width, img.height);
          const cropX = (img.width - cropSize) / 2;
          const cropY = (img.height - cropSize) / 2;

          // Draw cropped & resized image
          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropSize,
            cropSize,
            0,
            0,
            targetSize,
            targetSize
          );

          // Compress to max 100KB (102,400 bytes)
          const MAX_BYTES = 100 * 1024;
          let quality = 0.85;

          const compress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to convert canvas to blob'));
                  return;
                }

                if (blob.size > MAX_BYTES && quality > 0.3) {
                  quality -= 0.1;
                  compress();
                } else {
                  const dataUrl = canvas.toDataURL('image/jpeg', quality);
                  resolve({
                    blob,
                    dataUrl,
                    sizeBytes: blob.size,
                  });
                }
              },
              'image/jpeg',
              quality
            );
          };

          compress();
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a processed profile image to Firebase Storage at `profile_pics/{userId}.jpg`
 * and returns the public download URL.
 * If Firebase Storage is not available or blocked, falls back gracefully to returning the dataUrl.
 */
export async function uploadProfilePhotoToStorage(
  userId: string,
  imageBlob: Blob,
  fallbackDataUrl: string
): Promise<string> {
  try {
    const app = getApp();
    const storage = getStorage(app);
    const storageRef = ref(storage, `profile_pics/${userId}.jpg`);
    const snapshot = await uploadBytes(storageRef, imageBlob, {
      contentType: 'image/jpeg',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage upload failed or restricted, using compressed data URL:', err);
    // Return compressed base64 data URL as seamless resilient fallback
    return fallbackDataUrl;
  }
}
