import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || '',
    );
    this.bucketName = process.env.SUPABASE_BUCKET || 'fcdbb-images';
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new Error('Không tìm thấy file upload');
    }

    // Tạo tên file độc nhất để không bị trùng
    const fileName = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;

    // Bắn file lên Supabase
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(`Lỗi upload ảnh: ${error.message}`);
    }

    // Lấy link public để lưu vào Database
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }
}
