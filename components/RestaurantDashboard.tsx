
import React, { useState, useRef, useEffect } from 'react';
import { Delivery, DeliveryStatus } from '../types';

interface RestaurantDashboardProps {
  deliveries: Delivery[];
  onAddDelivery: (delivery: {
    customerName: string,
    pickupAddress: string,
    deliveryAddress: string,
    price: number,
    orderValue: number,
    isPaid: boolean,
    observations?: string
  }) => void;
  userName: string;
  currentUserId: string;
  onSendMessage: (deliveryId: string, text: string) => void;
  onCancelDelivery: (deliveryId: string) => void;
}

// Input Simples sem busca complexa de mapa
const SimpleInput: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
    <input
      type={type}
      className="w-full px-4 py-3 bg-slate-50 rounded-lg text-sm font-medium border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const ChatSection: React.FC<{
  delivery: Delivery,
  currentUserId: string,
  onSend: (text: string) => void,
  onClose: () => void
}> = ({ delivery, currentUserId, onSend, onClose }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [delivery.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 animate-fadeIn">
       <div className="flex justify-between items-center mb-2">
         <h4 className="text-xs font-bold text-slate-500 uppercase">Chat com Motoboy</h4>
         <button onClick={onClose} className="text-xs font-bold text-slate-400">Fechar</button>
       </div>
       <div className="h-40 bg-slate-50 rounded-lg p-3 overflow-y-auto mb-2 space-y-2">
         {(!delivery.messages || delivery.messages.length === 0) && (
           <p className="text-center text-[10px] text-slate-400 italic mt-10">Inicie a conversa...</p>
         )}
         {delivery.messages?.map(msg => {
           const isMe = msg.senderId === currentUserId;
           return (
             <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs font-medium ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                 {msg.text}
               </div>
             </div>
           )
         })}
         <div ref={messagesEndRef} />
       </div>
       <form onSubmit={handleSend} className="flex gap-2">
         <input
           value={text}
           onChange={e => setText(e.target.value)}
           placeholder="Digite..."
           className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
         />
         <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold">Enviar</button>
       </form>
    </div>
  );
};

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ deliveries, onAddDelivery, userName, currentUserId, onSendMessage, onCancelDelivery }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [deliveryToCancel, setDeliveryToCancel] = useState<string | null>(null);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('Minha Loja');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [priceTele, setPriceTele] = useState<number>(12.00);
  const [valueOrder, setValueOrder] = useState<number>(0.00);
  const [isPaid, setIsPaid] = useState(false);
  const [observations, setObservations] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDelivery({
      customerName,
      pickupAddress,
      deliveryAddress,
      price: priceTele,
      orderValue: valueOrder,
      isPaid,
      observations
    });
    setIsFormOpen(false);
    // Reset basic fields
    setCustomerName(''); setDeliveryAddress(''); setObservations(''); setValueOrder(0); setPriceTele(12.00); setIsPaid(false);
  };

  const handleConfirmCancel = () => {
    if (deliveryToCancel) {
      onCancelDelivery(deliveryToCancel);
      setDeliveryToCancel(null);
    }
  };

  const activeDeliveries = deliveries.filter(d => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.CANCELLED);

  return (
    <div className="p-6 space-y-6 relative">
      {/* Modal de Confirmação de Cancelamento */}
      {deliveryToCancel && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                ⚠️
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Cancelar Entrega?</h3>
              <p className="text-sm text-slate-500">
                Tem certeza que deseja cancelar esta entrega? Se o motoboy já estiver a caminho, pode haver taxas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliveryToCancel(null)}
                className="py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm uppercase"
              >
                Não, Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm uppercase shadow-lg active:scale-95 transition-transform"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg text-slate-800">{userName}</h2>
          <p className="text-xs text-green-600 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
          </p>
        </div>
      </div>

      {/* Action Button */}
      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full bg-slate-900 text-white p-5 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span>⚡</span> CHAMAR MOTOBOY
        </button>
      ) : (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-slideUp">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Nova Solicitação</h3>
            <button onClick={() => setIsFormOpen(false)} className="text-sm text-red-500 font-bold">Cancelar</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <SimpleInput label="Nome do Cliente" placeholder="Ex: João Silva" value={customerName} onChange={setCustomerName} />
            <SimpleInput label="Endereço de Retirada" placeholder="Ex: Rua da Loja, 100" value={pickupAddress} onChange={setPickupAddress} />
            <SimpleInput label="Endereço de Entrega" placeholder="Ex: Rua do Cliente, 500" value={deliveryAddress} onChange={setDeliveryAddress} />

            <div className="grid grid-cols-2 gap-4">
              <SimpleInput label="Valor Pedido (R$)" placeholder="0.00" type="number" value={valueOrder.toString()} onChange={(v) => setValueOrder(parseFloat(v) || 0)} />
              <SimpleInput label="Valor Tele (R$)" placeholder="12.00" type="number" value={priceTele.toString()} onChange={(v) => setPriceTele(parseFloat(v) || 0)} />
            </div>

            {/* Checkbox de Pagamento */}
            <div
              onClick={() => setIsPaid(!isPaid)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4 ${isPaid ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${isPaid ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}`}>
                {isPaid && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <div className="flex-1">
                <p className={`font-black text-sm uppercase ${isPaid ? 'text-green-700' : 'text-slate-500'}`}>
                  {isPaid ? 'Pedido Já Pago' : 'Cobrar na Entrega'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold">
                  {isPaid ? 'Motoboy apenas entrega.' : 'Motoboy deve receber o valor do cliente.'}
                </p>
              </div>
            </div>

            <SimpleInput label="Observações" placeholder="Ex: Troco para 50..." value={observations} onChange={setObservations} />

            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold mt-2">CONFIRMAR PEDIDO</button>
          </form>
        </div>
      )}

      {/* Active Deliveries List */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Entregas em Andamento</h3>
        <div className="space-y-3">
          {activeDeliveries.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">Nenhuma entrega ativa.</p>
          )}

          {activeDeliveries.map((d) => {
            const isChattable = d.status === DeliveryStatus.ACCEPTED || d.status === DeliveryStatus.PICKED_UP || d.status === DeliveryStatus.IN_TRANSIT;

            return (
              <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{d.customerName}</h4>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{d.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-blue-600">R$ {d.price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400">Tele</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      d.status === DeliveryStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                      d.status === DeliveryStatus.ACCEPTED ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {d.status === DeliveryStatus.PENDING ? 'Procurando...' : d.status === DeliveryStatus.ACCEPTED ? 'Aceito' : 'Em Rota'}
                    </span>
                    <button
                      onClick={() => setDeliveryToCancel(d.id)}
                      className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Cancelar Entrega"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                     {d.isPaid ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold uppercase">Pago</span>
                     ) : (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold uppercase">Cobrar</span>
                     )}
                    <span className="text-xs font-bold text-slate-400 mr-1">R$ {d.orderValue.toFixed(2)}</span>
                    {isChattable && activeChatId !== d.id && (
                      <button
                        onClick={() => setActiveChatId(d.id)}
                        className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200"
                      >
                        💬
                      </button>
                    )}
                  </div>
                </div>

                {activeChatId === d.id && (
                  <ChatSection
                    delivery={d}
                    currentUserId={currentUserId}
                    onSend={(text) => onSendMessage(d.id, text)}
                    onClose={() => setActiveChatId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
