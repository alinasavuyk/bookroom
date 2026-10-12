export async function uploadImageToCloudinary(file: File): Promise<string> {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: data }
  );
  const result = await res.json();
  return result.secure_url;
}
