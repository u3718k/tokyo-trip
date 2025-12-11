import React from 'react';
import { Tab } from '../types';
import { CalendarDays, BookOpen, Calculator, CheckSquare, Ticket } from 'lucide-react';

interface Props {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<Props> = ({ currentTab, onTabChange }) => {
  // Order: Rate, Guide, Plan (Center), Bookings, Lists
  const tabs = [
    { id: Tab.RATE, label: '匯率', icon: <Calculator size={20} /> },
    { id: Tab.GUIDE, label: '導覽', icon: <BookOpen size={20} /> },
    { id: Tab.PLAN, label: '行程', icon: <CalendarDays size={28} />, isCenter: true },
    { id: Tab.BOOKINGS, label: '預訂', icon: <Ticket size={20} /> },
    { id: Tab.LISTS, label: '清單', icon: <CheckSquare size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 pb-safe pt-2 px-1 z-50">
      <div className="flex justify-around items-end pb-2 relative">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          
          if (tab.isCenter) {
             return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="flex flex-col items-center justify-end -mt-6 transition-all duration-300"
                >
                  <div className={`p-4 rounded-full shadow-lg transition-all ${isActive ? 'bg-stone-800 text-white scale-110' : 'bg-white text-stone-400 border border-stone-100'}`}>
                    {tab.icon}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wide mt-1 ${isActive ? 'text-stone-800' : 'text-stone-400'}`}>
                    {tab.label}
                  </span>
                </button>
             );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 min-w-[50px] w-full transition-all duration-300 ${isActive ? 'text-stone-800 -translate-y-1' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-stone-100 shadow-sm' : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;