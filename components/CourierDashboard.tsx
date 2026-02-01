
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface CourierDashboardProps {
  allDeliveries: Delivery[];
  currentUserId: string;
  onUpdateStatus: (id: string, status: DeliveryStatus, courierId?: string) => void;
  onRefuseDelivery: (deliveryId: string, courierId: string) => void;
  onSendMessage: (deliveryId: string, text: string) => void;
}

const OrderCard: React.FC<{
  order: Delivery,
  onAccept: () => void,
  onRefuse: () => void
}> = ({ order, onAccept, onRefuse }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-4">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-bold text-slate-400 uppercase">{order.restaurantName}</p>
          {order.isPaid ? (
            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase">JÁ PAGO</span>
          ) : (
            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-black uppercase">COBRAR</span>
          )}
        </div>
        <h3 className="text-xl font-black text-slate-800">R$ {order.price.toFixed(2)}</h3>
      </div>
      <div className="bg-slate-100 px-3 py-1 rounded-md">
        <p className="text-[10px] font-bold text-slate-500 uppercase">Carga: R$ {order.orderValue.toFixed(2)}</p>
      </div>
    </div>

    <div className="space-y-3 mb-5">
      <div className="flex gap-3 items-start">
        <span className="text-blue-500 mt-0.5">⭘</span>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Retirada</p>
          <p className="text-sm font-medium text-slate-800 leading-tight">{order.pickupAddress}</p>
        </div>
      </div>
      <div className="flex gap-3 items-start">
        <span className="text-green-500 mt-0.5">📍</span>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Entrega</p>
          <p className="text-sm font-medium text-slate-800 leading-tight">{order.deliveryAddress}</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <button onClick={onRefuse} className="py-3 rounded-lg border border-slate-200 text-slate-500 font-bold text-sm">Recusar</button>
      <button onClick={onAccept} className="py-3 rounded-lg bg-slate-900 text-white font-bold text-sm shadow-md active:scale-95 transition-transform">ACEITAR</button>
    </div>
  </div>
);

const ActiveOrderCard: React.FC<{
  order: Delivery,
  currentUserId: string,
  onUpdateStatus: (status: DeliveryStatus) => void,
  onSendMessage: (text: string) => void
}> = ({ order, currentUserId, onUpdateStatus, onSendMessage }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isPickup = order.status === DeliveryStatus.ACCEPTED;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isChatOpen) scrollToBottom();
  }, [order.messages, isChatOpen]);

  const handleMainAction = () => {
    if (isPickup) {
      onUpdateStatus(DeliveryStatus.PICKED_UP);
    } else {
      setShowConfirm(true);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText('');
  };

  return (
    <div className="bg-blue-600 p-6 rounded-xl shadow-lg text-white mb-6 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs font-bold text-blue-200 uppercase mb-1">Em Andamento</p>
          <h3 className="text-2xl font-black">{isPickup ? order.restaurantName : order.customerName}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black">R$ {order.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white/10 p-4 rounded-lg border border-white/20 mb-6">
        <p className="text-xs font-bold text-blue-100 uppercase mb-1">Destino Atual</p>
        <p className="text-lg font-bold leading-tight">
          {isPickup ? order.pickupAddress : order.deliveryAddress}
        </p>
      </div>

      {order.status === DeliveryStatus.PICKED_UP && !showConfirm && (
         <div className={`p-4 rounded-lg mb-4 text-center border-2 shadow-sm ${order.isPaid ? 'bg-green-100 border-green-500' : 'bg-white border-white'}`}>
            <p className={`text-xs font-black uppercase tracking-widest mb-1 ${order.isPaid ? 'text-green-700' : 'text-blue-200'}`}>
              {order.isPaid ? '✅ PEDIDO JÁ PAGO' : '💰 COBRAR DO CLIENTE'}
            </p>
            {!order.isPaid ? (
               <p className="text-3xl font-black text-white">R$ {order.orderValue.toFixed(2)}</p>
            ) : (
               <p className="text-sm font-bold text-green-800">Apenas entregue, não cobrar.</p>
            )}
         </div>
      )}

      {/* Chat Section */}
      <div className="mb-6">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-full flex justify-between items-center py-2 px-4 bg-blue-700/50 rounded-lg text-xs font-bold uppercase tracking-wider mb-2"
        >
          <span>Chat com Restaurante</span>
          <span>{isChatOpen ? '▼' : '▲'}</span>
        </button>

        {isChatOpen && (
          <div className="bg-blue-800/50 rounded-lg p-3 animate-fadeIn">
            <div className="h-48 overflow-y-auto mb-3 space-y-2 pr-1 custom-scrollbar">
              {(!order.messages || order.messages.length === 0) && (
                <p className="text-center text-[10px] text-blue-300 italic py-4">Nenhuma mensagem.</p>
              )}
              {order.messages?.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs font-medium ${isMe ? 'bg-white text-blue-900' : 'bg-blue-900 text-white'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Mensagem..."
                className="flex-1 bg-blue-900/50 text-white text-xs px-3 py-2 rounded-lg outline-none placeholder-blue-300 focus:ring-1 focus:ring-white/50"
              />
              <button type="submit" className="bg-white text-blue-600 px-3 py-2 rounded-lg text-xs font-bold uppercase">Env</button>
            </form>
          </div>
        )}
      </div>

      {!showConfirm ? (
        <button
          onClick={handleMainAction}
          className="w-full bg-white text-blue-600 font-black py-4 rounded-lg uppercase tracking-wide active:scale-95 transition-transform"
        >
          {isPickup ? 'CONFIRMAR COLETA' : 'FINALIZAR ENTREGA'}
        </button>
      ) : (
        <div className="bg-red-500 p-4 rounded-lg animate-fadeIn border border-red-400">
          <div className="text-center mb-4">
             <p className="text-2xl mb-1">⚠️</p>
             <p className="font-black uppercase text-sm leading-tight">Só encerre esta entrega se tiver recebido o valor da tele</p>
             {!order.isPaid && <p className="text-xs mt-1 text-red-100 font-bold">(E cobrado o cliente R$ {order.orderValue.toFixed(2)})</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button
               onClick={() => setShowConfirm(false)}
               className="py-3 bg-red-700 text-white/80 font-bold rounded-lg text-xs uppercase"
             >
               Voltar
             </button>
             <button
               onClick={() => onUpdateStatus(DeliveryStatus.DELIVERED)}
               className="py-3 bg-white text-red-600 font-bold rounded-lg text-xs uppercase shadow-md active:scale-95 transition-transform"
             >
               Confirmar
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const CourierDashboard: React.FC<CourierDashboardProps> = ({ allDeliveries, currentUserId, onUpdateStatus, onRefuseDelivery, onSendMessage }) => {
  const [isOnline, setIsOnline] = useState(true);

  const availableOrders = useMemo(() => {
    return allDeliveries.filter(d => d.status === DeliveryStatus.PENDING && !(d.refusedBy || []).includes(currentUserId));
  }, [allDeliveries, currentUserId]);

  const currentActive = allDeliveries.find(d => d.courierId === currentUserId && (d.status === DeliveryStatus.ACCEPTED || d.status === DeliveryStatus.PICKED_UP));
  const todayEarnings = allDeliveries.filter(d => d.courierId === currentUserId && d.status === DeliveryStatus.DELIVERED).reduce((a, b) => a + b.price, 0);

  return (
    <div className="p-6">
      {/* Status Bar */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Ganhos Hoje</p>
          <p className="text-xl font-black text-slate-800">R$ {todayEarnings.toFixed(2)}</p>
        </div>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
        >
          {isOnline ? '🟢 Online' : '⚪ Offline'}
        </button>
      </div>

      {currentActive ? (
        <ActiveOrderCard
          order={currentActive}
          currentUserId={currentUserId}
          onUpdateStatus={(status) => onUpdateStatus(currentActive.id, status, currentUserId)}
          onSendMessage={(text) => onSendMessage(currentActive.id, text)}
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disponíveis ({availableOrders.length})</h3>

          {isOnline ? (
            availableOrders.length > 0 ? (
              availableOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => onUpdateStatus(order.id, DeliveryStatus.ACCEPTED, currentUserId)}
                  onRefuse={() => onRefuseDelivery(order.id, currentUserId)}
                />
              ))
            ) : (
              <div className="text-center py-12 opacity-50">
                <p className="text-4xl mb-2">😴</p>
                <p className="text-sm font-bold text-slate-500">Sem pedidos no momento</p>
              </div>
            )
          ) : (
            <div className="text-center py-12 opacity-50">
              <p className="text-sm font-bold text-slate-500">Você está offline</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
