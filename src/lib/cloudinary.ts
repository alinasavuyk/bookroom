import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
  } catch {
    // Якщо стиснення не вдалось (наприклад, формат, який canvas не декодує) —
    // просто вантажимо оригінал, а не блокуємо завантаження повністю
    return file;
  }
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const compressed = await compressImage(file);

  const data = new FormData();
  data.append('file', compressed);
  data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: data }
  );
  const result = await res.json();

  if (!res.ok || !result.secure_url) {
    throw new Error(result?.error?.message || 'Не вдалося завантажити фото');
  }

  return result.secure_url;
}
