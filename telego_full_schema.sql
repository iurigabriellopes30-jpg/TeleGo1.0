-- TELEGO: LOGÍSTICA INTELIGENTE - DATABASE SCHEMA (SUPABASE + POSTGRESQL)

-- 1. EXTENSÕES E ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'RESTAURANT', 'COURIER');
    CREATE TYPE delivery_status AS ENUM ('CREATED', 'PENDING_OFFER', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXPIRED');
    CREATE TYPE offer_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
    CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELAS CORE

-- Profiles (Extensão do Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'RESTAURANT',
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_name TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT DEFAULT 'Caxias do Sul',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couriers
CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    phone TEXT,
    vehicle_info TEXT, -- Marca/Modelo
    vehicle_plate TEXT UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    is_busy BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    courier_id UUID REFERENCES public.couriers(id), -- Null se ainda não aceito
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_details TEXT, -- Apt, bloco, etc.
    order_value NUMERIC(10,2) DEFAULT 0,
    delivery_fee NUMERIC(10,2) NOT NULL,
    status delivery_status DEFAULT 'CREATED',
    is_paid_to_restaurant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Offers (Controle de oferta sequencial)
CREATE TABLE IF NOT EXISTS public.delivery_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
    courier_id UUID REFERENCES public.couriers(id) ON DELETE CASCADE NOT NULL,
    status offer_status DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery Status History
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
    old_status delivery_status,
    new_status delivery_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals Tracking
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES public.profiles(id),
    status approval_status DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL, -- 'BASIC', 'PRO', 'PREMIUM'
    status TEXT NOT NULL, -- 'ACTIVE', 'CANCELLED', 'PAST_DUE'
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE NOT NULL,
    from_profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    to_profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    score INTEGER CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courier Locations
CREATE TABLE IF NOT EXISTS public.courier_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID REFERENCES public.couriers(id) ON DELETE CASCADE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SEGURANÇA (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_locations ENABLE ROW LEVEL SECURITY;

-- Helper Function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: PROFILES
CREATE POLICY "Profiles are viewable by everyone authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- POLICIES: RESTAURANTS
CREATE POLICY "Admins have full access on restaurants" ON public.restaurants FOR ALL USING (public.is_admin());
CREATE POLICY "Restaurants can view all active restaurants" ON public.restaurants FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Owners can update their own restaurant" ON public.restaurants FOR UPDATE USING (profile_id = auth.uid());

-- POLICIES: COURIERS
CREATE POLICY "Admins have full access on couriers" ON public.couriers FOR ALL USING (public.is_admin());
CREATE POLICY "Couriers can view their own data" ON public.couriers FOR SELECT USING (profile_id = auth.uid() OR public.is_admin());
CREATE POLICY "Couriers can update their own status" ON public.couriers FOR UPDATE USING (profile_id = auth.uid());

-- POLICIES: DELIVERIES
CREATE POLICY "Admins full access deliveries" ON public.deliveries FOR ALL USING (public.is_admin());
CREATE POLICY "Restaurants can view/create their deliveries" ON public.deliveries FOR ALL
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE profile_id = auth.uid()));
CREATE POLICY "Couriers can view assigned deliveries" ON public.deliveries FOR SELECT
USING (courier_id IN (SELECT id FROM public.couriers WHERE profile_id = auth.uid()));
CREATE POLICY "Couriers can update status of assigned deliveries" ON public.deliveries FOR UPDATE
USING (courier_id IN (SELECT id FROM public.couriers WHERE profile_id = auth.uid()));

-- POLICIES: DELIVERY OFFERS
CREATE POLICY "Couriers can see their offers" ON public.delivery_offers FOR SELECT USING (courier_id IN (SELECT id FROM public.couriers WHERE profile_id = auth.uid()));
CREATE POLICY "Couriers can update their offers status" ON public.delivery_offers FOR UPDATE USING (courier_id IN (SELECT id FROM public.couriers WHERE profile_id = auth.uid()));
CREATE POLICY "Restaurants see offers for their deliveries" ON public.delivery_offers FOR SELECT
USING (delivery_id IN (SELECT id FROM public.deliveries WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE profile_id = auth.uid())));

-- POLICIES: CHAT
CREATE POLICY "Users see chats for their deliveries" ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.deliveries d
        LEFT JOIN public.restaurants r ON d.restaurant_id = r.id
        LEFT JOIN public.couriers c ON d.courier_id = c.id
        WHERE d.id = delivery_id AND (r.profile_id = auth.uid() OR c.profile_id = auth.uid())
    ) OR public.is_admin()
);
CREATE POLICY "Users can send messages to their deliveries" ON public.chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.deliveries d
        LEFT JOIN public.restaurants r ON d.restaurant_id = r.id
        LEFT JOIN public.couriers c ON d.courier_id = c.id
        WHERE d.id = delivery_id AND (r.profile_id = auth.uid() OR c.profile_id = auth.uid())
    )
);

-- 4. TRIGGERS AUTOMÁTICOS

-- Função: Criar Perfil ao Registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'RESTAURANT'),
    CASE WHEN (NEW.raw_user_meta_data->>'role') = 'ADMIN' THEN TRUE ELSE FALSE END
  );

  -- Se for Courier ou Restaurant, insere na tabela correspondente pendente
  IF (NEW.raw_user_meta_data->>'role') = 'COURIER' THEN
    INSERT INTO public.couriers (profile_id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'));
    INSERT INTO public.approvals (profile_id) VALUES (NEW.id);
  ELSIF (NEW.raw_user_meta_data->>'role') = 'RESTAURANT' THEN
    INSERT INTO public.restaurants (profile_id, business_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'Nova Loja'));
    INSERT INTO public.approvals (profile_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função: Log de Histórico de Status
CREATE OR REPLACE FUNCTION public.log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.delivery_status_history (delivery_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_delivery_status_update
    AFTER UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE PROCEDURE public.log_delivery_status_change();

-- Função: Atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_approvals_updated_at BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
