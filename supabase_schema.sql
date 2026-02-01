-- Script SQL para Configuração do Supabase (TeleGo)

-- 1. Criar Enums para garantir a integridade dos status e tipos de usuário
CREATE TYPE user_role AS ENUM ('ADMIN', 'RESTAURANT', 'COURIER');
CREATE TYPE delivery_status AS ENUM ('PENDING', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXPIRED');

-- 2. Criar tabela de Perfis (extensão da tabela auth.users do Supabase)
-- Esta tabela armazena informações públicas e de controle do usuário
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'RESTAURANT',
  avatar TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Criar tabela de Entregas
CREATE TABLE public.deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.profiles(id) NOT NULL,
  restaurant_name TEXT, -- Mantido para compatibilidade com o frontend atual
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lon DOUBLE PRECISION,
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION,
  delivery_lon DOUBLE PRECISION,
  status delivery_status NOT NULL DEFAULT 'PENDING',
  courier_id UUID REFERENCES public.profiles(id),
  refused_by UUID[] DEFAULT '{}', -- Array de IDs de motoboys que recusaram a entrega
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_time TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 4. Criar tabela de Mensagens de Chat
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  sender_name TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (Row Level Security - RLS)

-- Perfis:
CREATE POLICY "Perfis visíveis para usuários autenticados" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários editam próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Entregas:
CREATE POLICY "Restaurantes veem suas próprias entregas" ON public.deliveries
  FOR SELECT USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurantes criam entregas" ON public.deliveries
  FOR INSERT WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Motoboys veem entregas disponíveis ou vinculadas" ON public.deliveries
  FOR SELECT USING (
    (status = 'PENDING') OR (courier_id = auth.uid())
  );

CREATE POLICY "Motoboys atualizam entregas que aceitaram ou estão pendentes" ON public.deliveries
  FOR UPDATE USING (
    (status = 'PENDING') OR (courier_id = auth.uid())
  );

CREATE POLICY "Admins veem tudo" ON public.deliveries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Chat:
CREATE POLICY "Envolvidos na entrega veem o chat" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deliveries
      WHERE public.deliveries.id = delivery_id
      AND (public.deliveries.restaurant_id = auth.uid() OR public.deliveries.courier_id = auth.uid())
    )
  );

CREATE POLICY "Envolvidos na entrega enviam mensagens" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliveries
      WHERE public.deliveries.id = delivery_id
      AND (public.deliveries.restaurant_id = auth.uid() OR public.deliveries.courier_id = auth.uid())
    )
  );

-- 6. Automação: Criar perfil automaticamente ao registrar novo usuário
-- Este trigger garante que quando um usuário se cadastrar via Auth do Supabase,
-- um registro correspondente seja criado na nossa tabela 'profiles'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário TeleGo'),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'RESTAURANT'::user_role),
    CASE WHEN (new.raw_user_meta_data->>'role') = 'ADMIN' THEN TRUE ELSE FALSE END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
