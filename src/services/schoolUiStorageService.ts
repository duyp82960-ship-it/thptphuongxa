import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const UI_DB_NAME = 'thpt_phuong_xa_school_ui_db';
const UI_DB_VERSION = 1;
const STORE_NAME = 'school_ui_assets';

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(UI_DB_NAME, UI_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveUiAsset(id: string, dataUrl: string, folder: string, name: string): Promise<void> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, dataUrl, folder, name, updatedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save UI asset warning:', err);
  }
}

export async function idbGetUiAsset(id: string): Promise<string | null> {
  try {
    const db = await openIndexedDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB get UI asset warning:', err);
    return null;
  }
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  squareCrop?: boolean;
}

/**
 * Compresses and optionally square-crops the image on HTML5 canvas.
 * Returns both a Blob for Cloud Storage and a DataURL for immediate fallback persistence.
 */
export function processImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<{ blob: Blob; dataUrl: string }> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.88,
    squareCrop = false,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('File không phải định dạng ảnh hợp lệ'));
      img.onload = () => {
        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        if (squareCrop) {
          const side = Math.min(srcW, srcH);
          srcX = (srcW - side) / 2;
          srcY = (srcH - side) / 2;
          srcW = side;
          srcH = side;
        }

        let destW = srcW;
        let destH = srcH;

        if (destW > maxWidth || destH > maxHeight) {
          const ratio = Math.min(maxWidth / destW, maxHeight / destH);
          destW = Math.round(destW * ratio);
          destH = Math.round(destH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = destW;
        canvas.height = destH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, destW, destH);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/webp';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Lỗi chuyển đổi ảnh'));
            }
            resolve({ blob, dataUrl });
          },
          mimeType,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image asset to Firebase Storage in directory school-ui/{folder}/
 * If Firebase Storage is unavailable/unauthorized, seamlessly falls back to persistent IndexedDB
 * so image is never lost upon refresh (F5) or logout.
 */
export async function uploadSchoolUiImage(
  file: File,
  folder: 'logo' | 'emblem' | 'header',
  options: CompressOptions = {}
): Promise<string> {
  // Validate allowed extensions
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Định dạng không hỗ trợ. Vui lòng chọn ảnh PNG, JPG, JPEG hoặc WEBP.');
  }

  // 1. Process & optimize on client
  const { blob, dataUrl } = await processImageFile(file, options);

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  const storagePath = `school-ui/${folder}/${Date.now()}_${cleanName}`;
  const assetId = `ui-asset-${folder}-${Date.now()}`;

  // 2. Always persist into IndexedDB as reliable client cache
  await idbSaveUiAsset(assetId, dataUrl, folder, file.name);

  // 3. Attempt upload to Firebase Storage
  try {
    if (storage) {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: blob.type || file.type,
        customMetadata: {
          folder,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (downloadUrl && downloadUrl.startsWith('http')) {
        return downloadUrl;
      }
    }
  } catch (storageErr) {
    console.warn('Firebase Storage upload failed or not enabled, using persistent local store:', storageErr);
  }

  // 4. Return reliable persistent data URL if Firebase Storage is unavailable
  return dataUrl;
}
