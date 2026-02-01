
import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, Delivery, DeliveryStatus, AppTab, User, AuthSession, ChatMessage } from './types';
import { Layout } from './components/Layout';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { CourierDashboard } from './components/CourierDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminActivityScreen } from './components/AdminActivityScreen';
import { LandingPage } from './components/LandingPage';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização e Recuperação de Sessão
  useEffect(() => {
    const initApp = async () => {
      const { data: { session: sbSession } } = await supabase.auth.getSession();

      if (sbSession?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sbSession.user.id)
          .single();

        if (profile && profile.approved) {
           let roleSpecificId = profile.id;
           if (profile.role === UserRole.RESTAURANT) {
             const { data: rest } = await supabase.from('restaurants').select('id').eq('profile_id', profile.id).single();
             if (rest) roleSpecificId = rest.id;
           } else if (profile.role === UserRole.COURIER) {
             const { data: cour } = await supabase.from('couriers').select('id').eq('profile_id', profile.id).single();
             if (cour) roleSpecificId = cour.id;
           }

          setSession({
            user: {
              id: profile.id,
              roleSpecificId,
              name: profile.full_name || profile.name,
              email: profile.email,
              role: profile.role as UserRole,
              avatar: profile.avatar_url,
              createdAt: new Date(profile.created_at).getTime(),
              approved: profile.approved
            },
            token: sbSession.access_token
          });
        }
      }

      const { data: initialDeliveries } = await supabase
        .from('deliveries')
        .select('*, chat_messages(*), restaurant:restaurants(business_name)')
        .order('created_at', { ascending: false });

      if (initialDeliveries) {
        setDeliveries(initialDeliveries.map(d => ({
          ...d,
          restaurantId: d.restaurant_id,
          restaurantName: d.restaurant?.business_name || 'Restaurante',
          customerName: d.customer_name,
          customerPhone: d.customer_phone,
          pickupAddress: d.pickup_address,
          deliveryAddress: d.delivery_address,
          orderValue: d.order_value,
          price: d.delivery_fee, // Mapeamento correto
          isPaid: d.is_paid_to_restaurant,
          courierId: d.courier_id,
          createdAt: new Date(d.created_at).getTime(),
          messages: d.chat_messages?.map((m: any) => ({
            ...m,
            senderId: m.sender_id,
            senderName: m.sender_name,
            timestamp: new Date(m.created_at).getTime()
          })) || []
        })));
      }

      setIsLoading(false);
    };

    initApp();
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const d = payload.new as any;
            // Fetch restaurant name for UI
            const { data: rest } = await supabase.from('restaurants').select('business_name').eq('id', d.restaurant_id).single();
            setDeliveries(prev => [{
              ...d,
              restaurantId: d.restaurant_id,
              restaurantName: rest?.business_name || 'Restaurante',
              customerName: d.customer_name,
              customerPhone: d.customer_phone,
              pickupAddress: d.pickup_address,
              deliveryAddress: d.delivery_address,
              orderValue: d.order_value,
              price: d.delivery_fee,
              isPaid: d.is_paid_to_restaurant,
              courierId: d.courier_id,
              createdAt: new Date(d.created_at).getTime(),
              messages: []
            }, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const d = payload.new as any;
            setDeliveries(prev => prev.map(old => old.id === d.id ? {
              ...old,
              ...d,
              restaurantId: d.restaurant_id,
              customerName: d.customer_name,
              customerPhone: d.customer_phone,
              pickupAddress: d.pickup_address,
              deliveryAddress: d.delivery_address,
              orderValue: d.order_value,
              price: d.delivery_fee,
              isPaid: d.is_paid_to_restaurant,
              courierId: d.courier_id,
              createdAt: new Date(d.created_at).getTime()
            } : old));
          } else if (payload.eventType === 'DELETE') {
            setDeliveries(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as any;
          setDeliveries(prev => prev.map(d => d.id === newMsg.delivery_id ? {
            ...d,
            messages: [...(d.messages || []), {
              ...newMsg,
              senderId: newMsg.sender_id,
              senderName: newMsg.sender_name,
              timestamp: new Date(newMsg.created_at).getTime()
            }]
          } : d));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setSession(prev => prev ? { ...prev, user: updatedUser } : null);
  }, []);

  const addDelivery = useCallback(async (newDelivery: Omit<Delivery, 'id' | 'createdAt' | 'status' | 'restaurantId' | 'restaurantName' | 'messages'>) => {
    if (!session || !session.user.roleSpecificId) return;

    const { error } = await supabase
      .from('deliveries')
      .insert({
        restaurant_id: session.user.roleSpecificId,
        customer_name: newDelivery.customerName,
        customer_phone: newDelivery.customerPhone,
        pickup_address: newDelivery.pickupAddress,
        delivery_address: newDelivery.deliveryAddress,
        delivery_fee: newDelivery.price,
        order_value: newDelivery.orderValue,
        is_paid_to_restaurant: newDelivery.isPaid,
        delivery_details: newDelivery.observations,
        status: DeliveryStatus.CREATED
      });

    if (error) {
      console.error('Erro ao adicionar entrega:', error);
      alert('Erro ao criar pedido: ' + error.message);
    }
  }, [session]);

  const updateDeliveryStatus = useCallback(async (id: string, status: DeliveryStatus, courierId?: string) => {
    const updateData: any = { status };
    if (courierId) {
       // Buscar ID do motoboy se for passado o profileId
       const { data: cour } = await supabase.from('couriers').select('id').eq('profile_id', courierId).single();
       if (cour) updateData.courier_id = cour.id;
       else updateData.courier_id = courierId; // fallback
    }

    const { error } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', id);

    if (error) console.error('Erro ao atualizar status:', error);
  }, []);

  const refuseDelivery = useCallback(async (deliveryId: string, courierId: string) => {
    // Na lógica sequential, a recusa deve atualizar a delivery_offers
    const { data: cour } = await supabase.from('couriers').select('id').eq('profile_id', courierId).single();
    if (!cour) return;

    const { error } = await supabase
      .from('delivery_offers')
      .update({ status: 'REJECTED' })
      .eq('delivery_id', deliveryId)
      .eq('courier_id', cour.id);

    if (error) console.error('Erro ao recusar entrega:', error);
  }, []);

  const handleSendMessage = useCallback(async (deliveryId: string, text: string) => {
    if (!session) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        delivery_id: deliveryId,
        sender_id: session.user.id,
        content: text
      });

    if (error) console.error('Erro ao enviar mensagem:', error);
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveTab(AppTab.HOME);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#8ecbff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderHomeContent = () => {
    if (!session) return null;
    if (session.user.role === UserRole.ADMIN) {
      return <AdminDashboard currentUser={session.user} deliveries={deliveries} />;
    }
    if (session.user.role === UserRole.RESTAURANT) {
      return (
        <RestaurantDashboard
          deliveries={deliveries.filter(d => (d as any).restaurant_id === session.user.roleSpecificId)}
          onAddDelivery={addDelivery}
          userName={session.user.name}
          currentUserId={session.user.id}
          onSendMessage={handleSendMessage}
          onCancelDelivery={(id) => updateDeliveryStatus(id, DeliveryStatus.CANCELLED)}
        />
      );
    }
    return (
      <CourierDashboard
        allDeliveries={deliveries}
        currentUserId={session.user.id}
        onUpdateStatus={updateDeliveryStatus}
        onRefuseDelivery={refuseDelivery}
        onSendMessage={handleSendMessage}
      />
    );
  };

  const renderMainContent = () => {
    if (!session) return <LandingPage onAuthSuccess={setSession} />;

    switch (activeTab) {
      case AppTab.HISTORY:
        if (session.user.role === UserRole.ADMIN) {
           return <AdminActivityScreen deliveries={deliveries} />;
        }
        return <HistoryScreen role={session.user.role} deliveries={deliveries} currentUserId={session.user.roleSpecificId || session.user.id} />;
      case AppTab.PROFILE:
        return (
          <ProfileScreen
            user={session.user}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            stats={{
              total: deliveries.filter(d => (session.user.role === UserRole.RESTAURANT ? ((d as any).restaurant_id === session.user.roleSpecificId) : ((d as any).courier_id === session.user.roleSpecificId))).length,
              delivered: deliveries.filter(d => (session.user.role === UserRole.RESTAURANT ? ((d as any).restaurant_id === session.user.roleSpecificId) : ((d as any).courier_id === session.user.roleSpecificId)) && d.status === DeliveryStatus.DELIVERED).length
            }}
          />
        );
      default:
        return renderHomeContent();
    }
  };

  return (
    <Layout role={session?.user.role || UserRole.UNSELECTED} activeTab={activeTab} onNavigate={setActiveTab} onLogout={handleLogout}>
      {renderMainContent()}
    </Layout>
  );
};

export default App;
