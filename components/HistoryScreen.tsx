
import React from 'react';
import { Delivery, UserRole, DeliveryStatus } from '../types';

interface HistoryScreenProps {
  role: UserRole;
  deliveries: Delivery[];
  currentUserId: string;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ role, deliveries, currentUserId }) => {
  const historyItems = role === UserRole.RESTAURANT
    ? deliveries.filter(d => d.restaurantId === currentUserId && d.status === DeliveryStatus.DELIVERED)
    : deliveries.filter(d => d.courierId === currentUserId && d.status === DeliveryStatus.DELIVERED);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h2 className="text-xl font-black text-slate-800">Histórico</h2>
        <p className="text-xs font-bold text-slate-400 uppercase">Total: {historyItems.length} entregas</p>
      </header>

      <div className="space-y-3">
        {historyItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Sem histórico ainda.
          </div>
        ) : (
          historyItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                <h4 className="font-bold text-slate-800 text-sm">{item.customerName}</h4>
                <p className="text-xs text-slate-500 mt-1">{item.deliveryAddress}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-800">R$ {item.price.toFixed(2)}</p>
                <span className="text-[10px] text-green-600 font-bold uppercase">Concluído</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
