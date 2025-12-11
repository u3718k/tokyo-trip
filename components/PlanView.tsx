import React, { useState, useRef, useEffect } from 'react';
import { GUIDE_SPOTS } from '../constants';
import { ItineraryItem, Tab } from '../types';
import { MapPin, Plane, Coffee, BedDouble, AlertCircle, Utensils, CloudRain, Sun, Cloud, Clock, X, Image as ImageIcon, Upload, TrainFront, Lock, Unlock, Trash2, Plus, BookOpen, Ticket, Sparkles, LayoutList, Pencil, Check, RotateCcw } from 'lucide-react';
import { useTripContext } from '../contexts/TripContext';

const PIN_CODE = '0000';

const getIcon = (type?: string) => {
  switch (type) {
    case 'flight': return <Plane size={16} />;
    case 'transport': return <TrainFront size={16} />; 
    case 'food': return <Utensils size={16} />;
    case 'hotel': return <BedDouble size={16} />;
    case 'important': return <AlertCircle size={16} />;
    case 'activity': return <MapPin size={16} />;
    default: return <Coffee size={16} />;
  }
};

const getWeatherIcon = (condition: string, size = 24, className = '') => {
  switch (condition) {
    case 'sunny': return <Sun size={size} className={`text-orange-400 ${className}`} />;
    case 'rainy': return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
    default: return <Cloud size={size} className={`text-gray-400 ${className}`} />;
  }
};

const getWeatherLabel = (condition: string) => {
    switch (condition) {
      case 'sunny': return '晴天';
      case 'rainy': return '雨天';
      case 'cloudy': return '多雲時晴';
      default: return '多雲';
    }
  };

const getCategoryColor = (type?: string) => {
  switch (type) {
    case 'flight': return 'border-pink-300 bg-pink-50'; // Pink
    case 'hotel': return 'border-blue-200 bg-blue-50'; // Blue
    case 'food': return 'border-yellow-300 bg-yellow-50'; // Yellow
    // All others white (transport, activity, important, etc.)
    default: return 'border-stone-200 bg-white';
  }
};

const CountdownWidget: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });
  const startDate = new Date('2025-12-17T00:00:00');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = startDate.getTime() - now.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        setTimeLeft({ days, hours });
      } else {
        setTimeLeft({ days: 0, hours: 0 });
      }
    };
    
    calculateTime();
    const timer = setInterval(calculateTime, 60000); 
    return () => clearInterval(timer);
  }, []);

  const isStarted = new Date() >= startDate;

  return (
    <div className="mx-4 mb-6 bg-stone-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="relative z-10 flex justify-between items-center">
        <div>
          <div className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-1">
            {isStarted ? '行程狀態' : '倒數計時'}
          </div>
          <div className="text-2xl font-bold">
            {isStarted ? '旅程進行中！' : '東京之旅'}
          </div>
        </div>
        <div className="text-right">
            {!isStarted ? (
                <>
                    <div className="text-4xl font-mono font-bold text-muji-highlight">{timeLeft.days}</div>
                    <div className="text-xs text-stone-400">天後出發</div>
                </>
            ) : (
                <div className="p-2 bg-muji-highlight rounded-full">
                    <Plane size={24} className="text-white" />
                </div>
            )}
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-stone-700 rounded-full opacity-50"></div>
    </div>
  );
};

interface DetailModalProps {
  item: ItineraryItem;
  dayDate: string;
  onClose: () => void;
  onNavigate: (tab: Tab, targetId?: string) => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ item, dayDate, onClose, onNavigate }) => {
  const { photos, uploadPhoto, removePhoto: deletePhoto, itinerary, updateItineraryItem } = useTripContext();
  
  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(item.notes || '');

  // Create a safe key for Firestore document ID
  const photoKey = `photo_${dayDate}_${item.time}`.replace(/[:.]/g, '-');
  const photo = photos[photoKey];

  const matchedGuide = !item.linkTo && GUIDE_SPOTS.find(g => 
    item.activity.includes(g.title) || (g.title.includes(item.activity))
  );

  const isBookingLink = !item.linkTo && (item.type === 'hotel' || item.type === 'food');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
         alert("圖片大小超過 500KB，請選擇較小的圖片！");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        try {
            uploadPhoto(photoKey, result);
        } catch (error) {
            alert("上傳失敗，請重試！");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
      if(window.confirm('確定要刪除這張照片嗎？')) {
        deletePhoto(photoKey);
      }
  };

  const handleSaveNote = () => {
      // Find the day index
      const dayIndex = itinerary.findIndex(d => d.date === dayDate.split('-').slice(1).join('/').replace('-', '/').replace('2025/', ''));
      const fallbackDayIndex = itinerary.findIndex(d => d.fullDate === dayDate || d.date === dayDate);
      
      const targetIndex = dayIndex !== -1 ? dayIndex : fallbackDayIndex;

      if (targetIndex !== -1) {
          const currentDayItems = itinerary[targetIndex].items;
          // We need to find the item. It could be a main item or a sub item.
          const updatedItems = currentDayItems.map(i => {
              if (i.id === item.id) {
                  return { ...i, notes: noteContent };
              }
              if (i.subItems) {
                  const updatedSub = i.subItems.map(s => s.id === item.id ? { ...s, notes: noteContent } : s);
                  return { ...i, subItems: updatedSub };
              }
              return i;
          });
          updateItineraryItem(targetIndex, updatedItems);
          setIsEditingNote(false);
      } else {
          console.error("Could not find day to update");
          alert("儲存失敗：找不到對應日期");
      }
  };

  const getLabel = (type?: string) => {
    switch(type) {
        case 'flight': return '航班';
        case 'transport': return '交通';
        case 'food': return '餐飲';
        case 'hotel': return '住宿';
        case 'important': return '重要';
        default: return '活動';
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative pointer-events-auto animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200">
          <X size={20} />
        </button>

        <div className="mb-6">
           <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 mb-2">
             {getLabel(item.type)}
           </span>
           <h3 className="text-2xl font-bold text-stone-800">{item.activity}</h3>
           <div className="flex items-center gap-2 text-stone-500 mt-1">
             <Clock size={16} />
             <span className="font-mono">{item.time}</span>
           </div>
           {item.location && (
               <div className="flex items-center gap-2 text-stone-500 mt-1">
                 <MapPin size={16} />
                 <span>{item.location}</span>
               </div>
           )}
        </div>

        {(item.linkTo || matchedGuide || isBookingLink) && (
            <div className="mb-6 flex gap-3">
                {(item.linkTo?.tab === Tab.GUIDE || matchedGuide) && (
                    <button 
                        onClick={() => onNavigate(Tab.GUIDE, item.linkTo?.targetId)}
                        className="flex-1 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                    >
                        <BookOpen size={18} /> 閱讀深度導覽
                    </button>
                )}
                {(item.linkTo?.tab === Tab.BOOKINGS || isBookingLink) && (
                    <button 
                        onClick={() => onNavigate(Tab.BOOKINGS, item.linkTo?.targetId)}
                        className="flex-1 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors"
                    >
                        <Ticket size={18} /> 查看預訂詳情
                    </button>
                )}
            </div>
        )}

        {/* Note Section */}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wide">備註</h4>
                {!isEditingNote ? (
                    <button onClick={() => setIsEditingNote(true)} className="text-stone-400 hover:text-stone-600 p-1">
                        <Pencil size={14} />
                    </button>
                ) : (
                    <div className="flex gap-2">
                         <button onClick={() => { setIsEditingNote(false); setNoteContent(item.notes || ''); }} className="text-stone-400 hover:text-red-500 p-1">
                            <X size={16} />
                        </button>
                        <button onClick={handleSaveNote} className="text-emerald-500 hover:text-emerald-700 p-1">
                            <Check size={16} />
                        </button>
                    </div>
                )}
            </div>
            
            {isEditingNote ? (
                <textarea 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-200 text-sm min-h-[80px]"
                    placeholder="輸入備註..."
                />
            ) : (
                item.notes ? (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                        <p className="text-stone-700 text-sm whitespace-pre-wrap">{item.notes}</p>
                    </div>
                ) : (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-center">
                        <p className="text-stone-400 text-sm italic">無備註</p>
                    </div>
                )
            )}
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6">
            {(item.location || item.activity) && (
                <a 
                    href={item.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location || item.activity)}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors"
                >
                    <MapPin size={18} /> 開啟 Google Maps
                </a>
            )}
        </div>

        <div className="border-t border-stone-100 pt-6">
            <h4 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
                <ImageIcon size={18} /> 旅途回憶 (同步分享)
            </h4>
            
            {photo ? (
                <div className="relative rounded-xl overflow-hidden group">
                    <img src={photo} alt="Memory" className="w-full h-48 object-cover" />
                    <button 
                        onClick={removePhoto}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
                    <Upload size={24} className="text-stone-400 mb-2" />
                    <span className="text-sm text-stone-500 font-medium">上傳照片</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
            )}
        </div>

      </div>
    </div>
  );
};

interface Props {
  onNavigate: (tab: Tab, targetId?: string) => void;
}

const PlanView: React.FC<Props> = ({ onNavigate }) => {
  const { itinerary, updateItineraryItem } = useTripContext(); // Global State
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteParentId, setDeleteParentId] = useState<string | null>(null); // To know if we delete a subItem

  const currentDay = itinerary[selectedDayIndex];
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const handleUnlock = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setShowPinModal(true);
      setPinInput('');
    }
  };

  const verifyPin = () => {
    if (pinInput === PIN_CODE) {
      setIsEditing(true);
      setShowPinModal(false);
    } else {
      alert('PIN 碼錯誤');
      setPinInput('');
    }
  };

  const handleDelete = (itemId: string, parentId?: string) => {
    setDeleteConfirmId(itemId);
    setDeleteParentId(parentId || null);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;

    if (deleteParentId) {
        // Delete a sub-item
        const parentItem = currentDay.items.find(i => i.id === deleteParentId);
        if (parentItem && parentItem.subItems) {
            const newSubItems = parentItem.subItems.filter(i => i.id !== deleteConfirmId);
            const newParent = { ...parentItem, subItems: newSubItems };
            const newItems = currentDay.items.map(i => i.id === deleteParentId ? newParent : i);
            updateItineraryItem(selectedDayIndex, newItems);
        }
    } else {
        // Delete a main item
        const items = currentDay.items.filter(i => i.id !== deleteConfirmId);
        updateItineraryItem(selectedDayIndex, items);
    }
    
    setDeleteConfirmId(null);
    setDeleteParentId(null);
  };

  const openAddModal = (parentId?: string) => {
      setAddingToParentId(parentId || null);
      setShowAddModal(true);
  };

  const handleAddItem = (newItem: ItineraryItem, isMainGroup: boolean) => {
    if (addingToParentId) {
        // Add as sub-item to existing parent
        const parentItem = currentDay.items.find(i => i.id === addingToParentId);
        if (parentItem) {
            const currentSubItems = parentItem.subItems || [];
            const newSubItems = [...currentSubItems, newItem];
            newSubItems.sort((a, b) => a.time.localeCompare(b.time));
            
            const newParent = { ...parentItem, subItems: newSubItems };
            const newItems = currentDay.items.map(i => i.id === addingToParentId ? newParent : i);
            updateItineraryItem(selectedDayIndex, newItems);
        }
    } else {
        // Add as root item
        const itemToAdd = isMainGroup ? { ...newItem, subItems: [] } : newItem;
        const items = [...currentDay.items, itemToAdd];
        items.sort((a, b) => a.time.localeCompare(b.time));
        updateItineraryItem(selectedDayIndex, items);
    }
    setShowAddModal(false);
    setAddingToParentId(null);
  };

  return (
    <div className="pb-24 pt-4 animate-in fade-in duration-500 relative min-h-screen flex flex-col">
      <div className="px-4 mb-2 flex justify-end">
          <button 
             onClick={handleUnlock}
             className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-stone-800 text-white shadow-md' : 'text-stone-300'}`}
          >
             {isEditing ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
      </div>

      <CountdownWidget />

      <div className="sticky top-14 z-30 bg-muji-bg/95 backdrop-blur-sm pb-2 pt-2 border-b border-stone-200/50">
          <div ref={dateScrollRef} className="flex overflow-x-auto no-scrollbar px-4 gap-3 snap-x">
              {itinerary.map((day, idx) => {
                  const isSelected = idx === selectedDayIndex;
                  return (
                      <button
                          key={idx}
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`snap-center flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 border ${isSelected ? 'bg-stone-800 text-white border-stone-800 shadow-md scale-105' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                      >
                          <span className="text-xs font-medium uppercase">{day.dayOfWeek}</span>
                          <span className="text-xl font-bold font-mono">{day.date.split('/')[1]}</span>
                      </button>
                  );
              })}
              <div className="w-2" />
          </div>
      </div>

      {currentDay && (
      <div className="flex-1 px-4 pt-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-100 mb-6 flex items-center justify-between">
               <div className="flex items-center gap-4">
                    {getWeatherIcon(currentDay.weather.condition, 32)}
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-stone-700">{getWeatherLabel(currentDay.weather.condition)}</span>
                        <span className="text-xs text-stone-400 font-medium">Tokyo</span>
                    </div>
               </div>
               <div className="text-2xl font-mono font-bold text-stone-800 tracking-tight">
                   {currentDay.weather.temp}
               </div>
          </div>

          <div className="relative pl-4 space-y-6">
              <div className="absolute left-[21px] top-2 bottom-0 w-0.5 bg-stone-200"></div>

              {currentDay.items.map((item) => {
                  // Render "Main Highlight" Card (Group)
                  // Note: If item has subItems array (even empty), we treat it as a group card
                  if (item.subItems) {
                      return (
                        <div key={item.id} className="relative pl-0 mb-8">
                            {isEditing && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                    className="absolute -left-2 top-0 bg-red-500 text-white p-1.5 rounded-full shadow-md z-30"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}

                            <div 
                                className="relative bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-emerald-100 mb-4 cursor-pointer active:scale-98 transition-transform"
                                onClick={() => setSelectedItem(item)}
                            >
                                <div className="h-28 bg-emerald-50 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-transparent"></div>
                                    <Sparkles className="absolute top-4 right-4 text-emerald-300 opacity-50" size={48} />
                                    <div className="absolute bottom-4 left-6">
                                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">重點行程</div>
                                        <h3 className="text-2xl font-bold text-stone-800">{item.activity}</h3>
                                        <div className="flex items-center gap-2 text-stone-600 mt-1">
                                            <Clock size={14} /> <span className="font-mono font-bold">{item.time}</span>
                                            <span className="text-stone-300">|</span>
                                            <MapPin size={14} /> <span>{item.location}</span>
                                        </div>
                                    </div>
                                    
                                    {isEditing && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openAddModal(item.id); }}
                                            className="absolute top-2 right-2 bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-transform flex items-center gap-1"
                                        >
                                            <Plus size={12} /> 新增子項目
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pl-4 space-y-3">
                                {item.subItems.length === 0 && (
                                    <div className="text-xs text-stone-400 italic pl-14">暫無子行程</div>
                                )}
                                {item.subItems.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-3 relative group" onClick={() => setSelectedItem(sub)}>
                                        <div className="w-14 text-right">
                                            <span className="text-xs font-mono font-bold text-stone-400">{sub.time}</span>
                                        </div>
                                        <div className={`flex-1 p-3 rounded-xl border cursor-pointer hover:bg-stone-50 transition-colors flex justify-between items-center ${getCategoryColor(sub.type)}`}>
                                            <div>
                                                <div className="font-bold text-stone-700 text-sm">{sub.activity}</div>
                                                {sub.notes && <div className="text-xs text-stone-400 mt-0.5">{sub.notes}</div>}
                                            </div>
                                            {sub.type === 'important' && <AlertCircle size={14} className="text-orange-400" />}
                                        </div>
                                        {isEditing && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(sub.id, item.id); }}
                                                className="absolute -right-2 bg-red-100 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                      );
                  }

                  // Standard Item
                  return (
                  <div key={item.id} className="relative flex gap-4 group">
                      {isEditing && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="absolute -left-2 top-0 bg-red-500 text-white p-1.5 rounded-full shadow-md z-30"
                          >
                             <Trash2 size={12} />
                          </button>
                      )}

                      <div className="z-10 flex-shrink-0 w-14 text-right pt-2" onClick={() => setSelectedItem(item)}>
                           <span className="text-xs font-mono font-bold text-stone-500 bg-muji-bg px-1 relative z-20">
                               {item.time}
                           </span>
                           <div className={`absolute left-[17px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-20 ${item.type === 'important' ? 'bg-muji-highlight' : 'bg-stone-400'}`}></div>
                      </div>

                      <div 
                         className={`flex-1 p-4 rounded-xl border-l-4 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-98 ${getCategoryColor(item.type)}`}
                         onClick={() => setSelectedItem(item)}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold leading-tight text-stone-800">{item.activity}</h4>
                              <div className="text-stone-400 opacity-50">{getIcon(item.type)}</div>
                          </div>
                          {item.location && (
                              <div className="flex items-center gap-1 text-xs mt-1 text-stone-500">
                                  <MapPin size={10} /> {item.location}
                              </div>
                          )}
                      </div>
                  </div>
              )})}
              
              <div className="h-12"></div>
          </div>
      </div>
      )}

      {selectedItem && (
          <DetailModal 
            item={selectedItem} 
            dayDate={currentDay?.date || ''} 
            onClose={() => setSelectedItem(null)} 
            onNavigate={onNavigate}
          />
      )}

      {isEditing && (
        <button 
          onClick={() => openAddModal()}
          className="fixed bottom-24 right-6 bg-stone-800 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center animate-in zoom-in hover:scale-105 transition-transform z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-6">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <h3 className="text-xl font-bold text-center mb-6 text-stone-800">安全檢查</h3>
             <input 
               type="password" 
               value={pinInput}
               onChange={(e) => setPinInput(e.target.value)}
               placeholder="輸入 PIN 碼"
               maxLength={4}
               className="w-full text-center text-4xl font-mono tracking-[0.5em] border-b-2 border-stone-200 focus:border-stone-800 outline-none pb-2 mb-8 bg-transparent"
               autoFocus
             />
             <div className="flex gap-4">
               <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-bold">取消</button>
               <button onClick={verifyPin} className="flex-1 py-3 rounded-xl bg-stone-800 text-white font-bold">解鎖</button>
             </div>
          </div>
        </div>
      )}

       {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <h3 className="text-xl font-bold text-stone-800 mb-4 text-center">刪除此行程？</h3>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold">取消</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">刪除</button>
                </div>
            </div>
        </div>
      )}

      {showAddModal && (
          <AddItemModal 
            onClose={() => { setShowAddModal(false); setAddingToParentId(null); }} 
            onSave={handleAddItem} 
            isSubItem={!!addingToParentId}
          />
      )}
    </div>
  );
};

const AddItemModal: React.FC<{ 
    onClose: () => void, 
    onSave: (item: ItineraryItem, isMainGroup: boolean) => void,
    isSubItem: boolean 
}> = ({ onClose, onSave, isSubItem }) => {
    const [time, setTime] = useState('');
    const [activity, setActivity] = useState('');
    const [location, setLocation] = useState('');
    const [type, setType] = useState('activity');
    const [notes, setNotes] = useState('');
    
    // Toggle for Main Group creation
    const [isMainGroup, setIsMainGroup] = useState(false);
    
    const [isConfirming, setIsConfirming] = useState(false);

    const handleSave = () => {
        if (!time || !activity) return;
        
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        const newItem: ItineraryItem = {
            id: Date.now().toString(),
            time,
            activity,
            location,
            type: type as any,
            notes
        };

        onSave(newItem, isMainGroup);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl">
                        {isSubItem ? '新增子項目' : '新增行程'}
                    </h3>
                    <button onClick={onClose}><X size={24} className="text-stone-400" /></button>
                </div>
                
                {isConfirming ? (
                    <div className="text-center py-4">
                        <div className="mb-6 text-stone-600">
                            確定要新增 <span className="font-bold text-stone-800">{activity}</span> 嗎？
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsConfirming(false)} 
                                className="flex-1 py-3 bg-stone-100 text-stone-500 font-bold rounded-xl"
                            >
                                修改
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-1 py-3 bg-muji-highlight text-white font-bold rounded-xl shadow-md"
                            >
                                確定新增
                            </button>
                        </div>
                    </div>
                ) : (
                <div className="space-y-4">
                    {/* Main Group Toggle - Only show if creating root item */}
                    {!isSubItem && (
                        <div 
                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isMainGroup ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300' : 'bg-stone-50 border-stone-200'}`}
                            onClick={() => setIsMainGroup(!isMainGroup)}
                        >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isMainGroup ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-stone-300'}`}>
                                {isMainGroup && <LayoutList size={14} />}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-stone-800">設為重點行程群組</div>
                                <div className="text-xs text-stone-500">適合樂園、大型景點等包含多個子活動的行程</div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                         <div className="w-1/3">
                            <label className="text-xs font-bold text-stone-500 block mb-1">時間</label>
                            <input value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="HH:MM" />
                         </div>
                         <div className="flex-1">
                            <label className="text-xs font-bold text-stone-500 block mb-1">活動名稱</label>
                            <input value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="活動內容" />
                         </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">地點</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="地點" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">類型</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50">
                            <option value="activity">一般活動</option>
                            <option value="transport">交通移動</option>
                            <option value="food">用餐 (餐廳)</option>
                            <option value="flight">飛行</option>
                            <option value="hotel">住宿</option>
                            <option value="important">重要事項</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">備註</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 h-20" placeholder="備註..." />
                    </div>
                    <button onClick={handleSave} className="w-full py-4 bg-stone-800 text-white font-bold rounded-xl mt-2">
                        下一步
                    </button>
                </div>
                )}
            </div>
        </div>
    );
};

export default PlanView;