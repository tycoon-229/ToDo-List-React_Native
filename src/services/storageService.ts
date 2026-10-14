import { supabase } from './supabase';

/**
 * Tải file (PNG, JPG, GIF, WEBP) lên bucket 'images' trong Supabase Storage
 * @param file Tệp được chọn từ thẻ <input type="file" />
 * @param userId ID của người dùng
 * @param prefix 'avatar' hoặc 'cover'
 * @returns Public URL truy cập ảnh/GIF
 */
export async function uploadMediaToBucket(
  file: File,
  userId: string,
  prefix: 'avatar' | 'cover'
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'gif';
  const filePath = `${userId}/${prefix}_${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || (extension === 'gif' ? 'image/gif' : 'image/png'),
    });

  if (uploadError) {
    throw new Error(`Upload lỗi: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}