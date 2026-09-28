import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { HomepageBackground, BackgroundPosition } from '../types';
import {
  idbSaveBackground,
  idbGetAllBackgrounds,
  idbDeleteBackground,
} from './imageStorageService';

export const HOMEPAGE_BG_COLLECTION = 'homepage_backgrounds';

// Fallback background image when no custom background is stored in database
// Note: This is strictly a fallback and is NEVER written into the database on boot
export const DEFAULT_HOMEPAGE_BACKGROUND: HomepageBackground = {
  id: 'default-system-bg',
  file_name: 'thpt_phuong_xa_campus_default.webp',
  file_path: 'system/defaults/thpt_phuong_xa_campus_default.webp',
  image_url:
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=2069&auto=format&fit=crop',
  position: 'center center',
  overlay_opacity: 30, // 30% default overlay
  is_active: true,
  uploaded_by: 'Hệ thống Quản trị THPT Phương Xá',
  created_at: '2026-09-01T00:00:00.000Z',
};

/**
 * Validates and compresses an image file before upload.
 * - Supports JPG, JPEG, PNG, WEBP
 * - Max size: 10MB
 * - Automatically resizes (max 1920x1080) and converts to WebP (0.85 quality) to ensure fast load & robust persistence
 */
export async function compressAndValidateImage(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
}> {
  // 1. Validate file format
  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const fileExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');

  const isValidType =
    validMimeTypes.includes(file.type.toLowerCase()) ||
    validExtensions.includes(fileExt);

  if (!isValidType) {
    throw new Error('Định dạng file không hợp lệ! Vui lòng chọn ảnh định dạng JPG, JPEG, PNG hoặc WEBP.');
  }

  // 2. Validate max size (10MB)
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('Dung lượng ảnh vượt quá 10MB! Vui lòng chọn ảnh có kích thước nhỏ hơn.');
  }

  // 3. Compress using Canvas (client-side optimization)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio preserving dimensions
          if (width > maxWidth || height > maxHeight) {
            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original data URL if canvas context unavailable
            resolve({
              dataUrl: readerEvent.target?.result as string,
              fileName: file.name,
              originalSize: file.size,
              compressedSize: file.size,
            });
            return;
          }

          // Draw image smoothly
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP format, fallback to JPEG
          let quality = 0.85;
          let compressedDataUrl = canvas.toDataURL('image/webp', quality);
          if (!compressedDataUrl.startsWith('data:image/webp')) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Calculate approximate byte size of base64
          const approximateSize = Math.round(
            (compressedDataUrl.length * 3) / 4 - (compressedDataUrl.indexOf(';') > 0 ? 2 : 0)
          );

          resolve({
            dataUrl: compressedDataUrl,
            fileName: file.name,
            originalSize: file.size,
            compressedSize: approximateSize,
          });
        } catch (err) {
          reject(new Error('Lỗi khi nén ảnh: ' + (err instanceof Error ? err.message : String(err))));
        }
      };

      img.onerror = () => {
        reject(new Error('Không thể xử lý file ảnh. Vui lòng thử lại với file ảnh khác.'));
      };

      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string;
      } else {
        reject(new Error('Không thể đọc file ảnh.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Không thể đọc dữ liệu file từ thiết bị.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Fetch all stored backgrounds from Firestore, with IndexedDB sync
 */
export async function dbFetchAllBackgrounds(): Promise<HomepageBackground[]> {
  try {
    const querySnap = await getDocs(collection(db, HOMEPAGE_BG_COLLECTION));
    if (!querySnap.empty) {
      const list = querySnap.docs.map((docSnap) => docSnap.data() as HomepageBackground);
      // Sort by created_at desc
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      // Mirror to IndexedDB
      for (const item of list) {
        await idbSaveBackground(item);
      }
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetch backgrounds error, checking IndexedDB cache:', err);
  }

  // Fallback to IndexedDB
  const cached = await idbGetAllBackgrounds();
  if (cached.length > 0) {
    cached.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return cached as HomepageBackground[];
  }

  return [];
}

/**
 * Save new background to Firestore & IndexedDB.
 * If is_active is true, sets all other stored backgrounds to is_active = false.
 */
export async function dbSaveBackground(bg: HomepageBackground): Promise<void> {
  const batch = writeBatch(db);

  // If this new background is active, set other records to inactive
  if (bg.is_active) {
    try {
      const existingSnap = await getDocs(collection(db, HOMEPAGE_BG_COLLECTION));
      existingSnap.docs.forEach((docSnap) => {
        if (docSnap.id !== bg.id) {
          batch.update(docSnap.ref, { is_active: false, updated_at: new Date().toISOString() });
        }
      });
    } catch (e) {
      console.warn('Could not query other backgrounds to deactivate:', e);
    }
  }

  // Add the new or updated background
  const targetRef = doc(db, HOMEPAGE_BG_COLLECTION, bg.id);
  batch.set(targetRef, bg, { merge: true });

  await batch.commit();

  // Also persist to IndexedDB
  await idbSaveBackground(bg);
}

/**
 * Set an existing background as the active one
 */
export async function dbSetActiveBackground(id: string): Promise<void> {
  const allBackgrounds = await dbFetchAllBackgrounds();
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const item of allBackgrounds) {
    const isTarget = item.id === id;
    const docRef = doc(db, HOMEPAGE_BG_COLLECTION, item.id);
    batch.update(docRef, { is_active: isTarget, updated_at: now });
    await idbSaveBackground({ ...item, is_active: isTarget, updated_at: now });
  }

  await batch.commit();
}

/**
 * Update positioning or overlay opacity of a background
 */
export async function dbUpdateBackgroundConfig(
  id: string,
  updates: { position?: BackgroundPosition; overlay_opacity?: number }
): Promise<void> {
  const docRef = doc(db, HOMEPAGE_BG_COLLECTION, id);
  const dataToUpdate = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await setDoc(docRef, dataToUpdate, { merge: true });

  // Update in IndexedDB
  const cachedList = await idbGetAllBackgrounds();
  const found = cachedList.find((b) => b.id === id);
  if (found) {
    await idbSaveBackground({ ...found, ...dataToUpdate });
  }
}

/**
 * Delete a background from Firestore & IndexedDB
 */
export async function dbDeleteBackground(id: string): Promise<void> {
  const docRef = doc(db, HOMEPAGE_BG_COLLECTION, id);
  await deleteDoc(docRef);
  await idbDeleteBackground(id);
}
