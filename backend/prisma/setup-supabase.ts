import { Client } from 'pg';
import "dotenv/config";

async function main() {
  console.log('🚀 Đang thiết lập Supabase (Storage, Auth Sync Trigger, RLS)...');

  // Use the DIRECT_URL (port 5432) to bypass PgBouncer session restrictions for DDL commands
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();

    // 1. Storage Buckets Setup
    console.log('📦 1/3 Cấu tạo rổ lưu trữ (Storage)...');
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('pomelo-public', 'pomelo-public', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('pomelo-kyc-private', 'pomelo-kyc-private', false)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Auth Trigger (Sync from auth.users -> public.User)
    console.log('🔗 2/3 Cài đặt Auto-sync Trigger (Đăng ký tài khoản)...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user() 
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public."User" (id, email, created_at)
        VALUES (new.id, new.email, new.created_at);
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);

    // 3. Row Level Security (RLS) Config
    console.log('🛡️ 3/3 Kích hoạt Tường lửa Row Level Security (RLS)...');
    await client.query(`ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;`);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'User' AND policyname = 'Cho phép người dùng ĐỌC profile của chính mình'
        ) THEN
          CREATE POLICY "Cho phép người dùng ĐỌC profile của chính mình" 
          ON public."User" FOR SELECT 
          USING (auth.uid() = id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'User' AND policyname = 'Cho phép người dùng SỬA profile của chính mình'
        ) THEN
          CREATE POLICY "Cho phép người dùng SỬA profile của chính mình" 
          ON public."User" FOR UPDATE 
          USING (auth.uid() = id)
          WITH CHECK (auth.uid() = id);
        END IF;
      END
      $$;
    `);

    console.log('✅ Hoàn tất thiết lập Supabase! Bạn đã có thể đăng nhập bằng Supabase Auth.');
  } catch (error) {
    console.error('❌ Phát hiện lỗi trong quá trình cấu hình:', error);
  } finally {
    await client.end();
  }
}

main();
