import React, { useState, useEffect, useRef } from 'react';
import { BookingItem, BookingType } from '../types';
import { Plane, BedDouble, Utensils, MapPin, Clock, Users, ExternalLink, Lock, Unlock, Trash2, Plus, X, Calendar, Upload, Camera, AlertTriangle } from 'lucide-react';
import { useTripContext } from '../contexts/TripContext';
import { compressImage } from '../contexts/TripContext'; // Import helper

const PIN_CODE = '0000';

interface Props {
  highlightId?: string | null;
}

const BookingsView: React.FC<Props> = ({ highlightId }) => {
  // Use Global State
  const { bookings, addBooking, deleteBooking, updateBookingPhoto } = useTripContext();

  const [isEditing, setIsEditing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [photoTargetId, setPhotoTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flightsRef = useRef<HTMLDivElement>(null);
  const hotelsRef = useRef<HTMLDivElement>(null);
  const diningRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (highlightId && bookings.length > 0) {
          setTimeout(() => {
              const element = document.getElementById(highlightId);
              if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              }
          }, 100);
      }
  }, [highlightId, bookings]);

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

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteBooking(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handlePhotoEditClick = (id: string) => {
    setPhotoTargetId(id);
    setTimeout(() => {
        fileInputRef.current?.click();
    }, 0);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && photoTargetId) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
            const compressed = await compressImage(rawBase64);
            updateBookingPhoto(photoTargetId, compressed);
            setPhotoTargetId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch(e) {
            alert("圖片處理失敗");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = (newItem: BookingItem) => {
    addBooking(newItem);
    setShowAddModal(false);
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const flights = bookings.filter(b => b.type === 'flight');
  const hotels = bookings.filter(b => b.type === 'hotel');
  const dining = bookings.filter(b => b.type === 'dining');

  return (
    <div className="pt-4 px-4 relative animate-in fade-in duration-500 min-h-screen">
      
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handlePhotoFileChange} 
      />

      <div className="flex justify-between items-center mb-4 px-1 sticky top-0 bg-muji-bg z-30 pt-2 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-wider">預訂</h2>
          <div className="w-10 h-1 bg-muji-highlight mt-1 rounded-full"></div>
        </div>
        <button 
          onClick={handleUnlock}
          className={`p-3 rounded-2xl transition-all ${isEditing ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}
        >
          {isEditing ? <Unlock size={20} /> : <Lock size={20} />}
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          <button onClick={() => scrollToSection(flightsRef)} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-stone-600 font-bold text-sm shadow-sm active:bg-stone-100 whitespace-nowrap">
              <Plane size={16} /> 機票
          </button>
          <button onClick={() => scrollToSection(hotelsRef)} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-stone-600 font-bold text-sm shadow-sm active:bg-stone-100 whitespace-nowrap">
              <BedDouble size={16} /> 住宿
          </button>
          <button onClick={() => scrollToSection(diningRef)} className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-stone-600 font-bold text-sm shadow-sm active:bg-stone-100 whitespace-nowrap">
              <Utensils size={16} /> 餐廳
          </button>
      </div>

      <div className="space-y-10">
        {flights.length > 0 && (
            <div ref={flightsRef}>
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3 ml-1">機票</h3>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 no-scrollbar">
                    {flights.map((item) => (
                        <div key={item.id} id={item.id} className="snap-center min-w-[90vw] sm:min-w-[350px] relative group scroll-m-24">
                            <div className={`absolute -inset-1 rounded-[2rem] transition-opacity duration-500 bg-gradient-to-r from-orange-200 to-orange-100 -z-10 ${highlightId === item.id ? 'opacity-100' : 'opacity-0'}`}></div>
                            {isEditing && (
                            <button 
                                onClick={() => requestDelete(item.id)}
                                className="absolute -top-2 -right-2 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            )}

                            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200 relative h-full flex flex-col">
                                <div className="absolute top-[65%] -left-3 w-6 h-6 bg-muji-bg rounded-full z-10 border-r border-stone-200"></div>
                                <div className="absolute top-[65%] -right-3 w-6 h-6 bg-muji-bg rounded-full z-10 border-l border-stone-200"></div>
                                
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-stone-100 rounded-full text-stone-600">
                                                <Plane size={24} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xl text-stone-800">{item.title}</div>
                                                <div className="text-xs text-stone-400 font-mono tracking-wider">{item.date}</div>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-mono font-bold text-stone-800">{item.subTitle}</div>
                                    </div>

                                    <div className="flex justify-between items-center px-2 mb-2">
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-stone-800 font-mono">{item.details.from}</div>
                                            {item.details.terminal && <div className="text-[10px] font-bold bg-stone-100 text-stone-500 rounded px-1 mt-1 inline-block">{item.details.terminal}</div>}
                                            <div className="text-sm font-bold text-stone-500 mt-1">{item.details.departTime}</div>
                                        </div>
                                        <div className="flex-1 border-b-2 border-dashed border-stone-300 mx-4 relative top-[-10px]">
                                            <Plane size={16} className="absolute -top-[9px] left-1/2 -translate-x-1/2 text-stone-300 rotate-90" />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-stone-800 font-mono">{item.details.to}</div>
                                            <div className="text-sm font-bold text-stone-500 mt-1">{item.details.arriveTime}</div>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div className="border-b-2 border-dashed border-stone-200 w-full relative"></div>

                                <div className="bg-stone-50 p-4 grid grid-cols-3 gap-2 text-center">
                                    <div className="border-r border-stone-200 last:border-0">
                                        <span className="text-[10px] text-stone-400 block uppercase font-bold">報到櫃檯</span>
                                        <span className="font-bold font-mono text-lg text-stone-800">{item.details.counter || '--'}</span>
                                    </div>
                                    <div className="border-r border-stone-200 last:border-0">
                                        <span className="text-[10px] text-stone-400 block uppercase font-bold">登機門</span>
                                        <span className="font-bold font-mono text-lg text-muji-highlight">{item.details.gate || '--'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-stone-400 block uppercase font-bold">行李轉盤</span>
                                        <span className="font-bold font-mono text-lg text-stone-800">{item.details.baggage || '--'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {hotels.length > 0 && (
            <div ref={hotelsRef} className="scroll-mt-24">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3 ml-1">住宿</h3>
                <div className="space-y-4">
                    {hotels.map((item) => (
                        <div 
                            key={item.id} 
                            id={item.id} 
                            className={`relative group bg-white rounded-3xl overflow-hidden shadow-sm border transition-all duration-500 ${highlightId === item.id ? 'ring-4 ring-orange-200 border-orange-400 scale-[1.02]' : 'border-stone-200'}`}
                        >
                            {isEditing && (
                              <>
                                <button 
                                    onClick={() => requestDelete(item.id)}
                                    className="absolute top-2 right-2 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handlePhotoEditClick(item.id)}
                                    className="absolute top-2 right-12 z-20 bg-stone-800/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-stone-900 transition-colors"
                                    title="更換照片"
                                >
                                    <Camera size={16} />
                                </button>
                              </>
                            )}
                            
                            <div className="relative h-48">
                                <img 
                                    src={item.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <div className="flex items-center gap-2 text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded-md w-fit mb-2">
                                        <BedDouble size={12} /> {item.subTitle}
                                    </div>
                                    <h3 className="font-bold text-2xl leading-tight">{item.title}</h3>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-stone-100">
                                    <div>
                                        <div className="text-xs text-stone-400 uppercase">入住</div>
                                        <div className="font-bold text-stone-800 font-mono text-xl">{item.details.checkIn}</div>
                                    </div>
                                    <div className="text-stone-300 text-2xl font-light">/</div>
                                    <div className="text-right">
                                        <div className="text-xs text-stone-400 uppercase">退房</div>
                                        <div className="font-bold text-stone-800 font-mono text-xl">{item.details.checkOut}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-start gap-2 text-sm text-stone-600 flex-1">
                                        <MapPin size={16} className="mt-0.5 flex-shrink-0 text-muji-highlight" />
                                        <span className="line-clamp-2">{item.details.address}</span>
                                    </div>
                                    <a 
                                        href={item.details.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title + ' ' + (item.details.address || ''))}`}
                                        target="_blank"
                                        rel="noreferrer" 
                                        className="p-3 bg-stone-100 rounded-xl text-stone-600 hover:bg-stone-200 transition-colors"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {dining.length > 0 && (
            <div ref={diningRef} className="scroll-mt-24">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3 ml-1">餐廳</h3>
                <div className="space-y-4">
                    {dining.map((item) => (
                        <div 
                            key={item.id} 
                            id={item.id} 
                            className={`relative group bg-white rounded-3xl overflow-hidden shadow-sm border flex flex-col sm:flex-row transition-all duration-500 ${highlightId === item.id ? 'ring-4 ring-orange-200 border-orange-400 scale-[1.02]' : 'border-stone-200'}`}
                        >
                            {isEditing && (
                              <>
                                <button 
                                    onClick={() => requestDelete(item.id)}
                                    className="absolute top-2 right-2 z-20 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handlePhotoEditClick(item.id)}
                                    className="absolute top-2 right-12 z-20 bg-stone-800/80 backdrop-blur-sm text-white p-2 rounded-full shadow-lg hover:bg-stone-900 transition-colors"
                                    title="更換照片"
                                >
                                    <Camera size={16} />
                                </button>
                              </>
                            )}

                            <div className="w-full sm:w-1/3 h-40 sm:h-auto relative">
                                <img 
                                    src={item.imageUrl || 'https://via.placeholder.com/150x200?text=Food'} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover absolute inset-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
                                    }}
                                />
                            </div>
                            <div className="flex-1 p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">預約</span>
                                    </div>
                                    <h3 className="font-bold text-xl text-stone-800 leading-tight mb-1">{item.title}</h3>
                                    <div className="text-xs text-stone-500 mb-4">{item.subTitle}</div>
                                    
                                    <div className="space-y-2 text-sm text-stone-700 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-stone-400" />
                                            <span className="font-mono">{item.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-stone-400" />
                                            <span className="font-mono font-bold text-muji-highlight text-lg">{item.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-stone-400" />
                                            <span>{item.details.pax} 人</span>
                                        </div>
                                    </div>
                                </div>

                                <a 
                                    href={item.details.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`} 
                                    target="_blank"
                                    rel="noreferrer" 
                                    className="w-full bg-stone-800 hover:bg-stone-700 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <MapPin size={16} /> 查看地圖
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {isEditing && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 right-6 bg-stone-800 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center animate-in zoom-in hover:scale-105 transition-transform z-40"
          >
            <Plus size={28} />
          </button>
        )}

        <div className="h-32 w-full"></div>
      </div>

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6">
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-stone-800">確定要刪除嗎？</h3>
                    <p className="text-sm text-stone-500 mt-2">此動作無法復原。</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteTargetId(null)} 
                        className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={confirmDelete} 
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-sm"
                    >
                        刪除
                    </button>
                </div>
            </div>
        </div>
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

      {showAddModal && (
        <AddBookingModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />
      )}
    </div>
  );
};

const AddBookingModal: React.FC<{ onClose: () => void, onSave: (item: BookingItem) => void }> = ({ onClose, onSave }) => {
  const [type, setType] = useState<BookingType>('dining');
  const [title, setTitle] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<string>(''); 
  
  const [flightFrom, setFlightFrom] = useState('');
  const [flightTo, setFlightTo] = useState('');
  const [gate, setGate] = useState('');
  
  const [isConfirming, setIsConfirming] = useState(false);
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
            const compressed = await compressImage(rawBase64);
            setImageFile(compressed);
        } catch (error) {
            alert("圖片處理失敗！");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!title || !date) return;
    
    if (!isConfirming) {
        setIsConfirming(true);
        return;
    }

    const newItem: BookingItem = {
      id: Date.now().toString(),
      type,
      title,
      subTitle: subTitle || (type === 'flight' ? 'Flight #' : type === 'hotel' ? '1 Night' : 'Reservation'),
      date,
      time,
      imageUrl: imageFile, 
      details: type === 'flight' ? { 
          from: flightFrom || 'AAA', 
          to: flightTo || 'BBB', 
          departTime: time, 
          arriveTime: '--', 
          gate: gate || '--',
          terminal: '--',
          counter: '--',
          baggage: '--'
      } : type === 'hotel' ? { 
          checkIn: time, 
          checkOut: '--', 
          address: location || 'Tokyo',
          mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || title)}`
      } : { 
          pax: 2, 
          mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || title)}`
      }
    };
    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">新增預訂</h3>
            <button onClick={onClose}><X size={24} className="text-stone-400" /></button>
         </div>
         
         {isConfirming ? (
             <div className="text-center py-6">
                 <div className="mb-8 text-stone-600">
                     確定要新增 <span className="font-bold text-stone-800">{title}</span> 的預訂嗎？
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
            <div>
               <label className="block text-xs font-bold text-stone-500 mb-1">類型</label>
               <div className="flex gap-2">
                 {[
                    {id: 'flight', label: '機票'}, 
                    {id: 'hotel', label: '住宿'}, 
                    {id: 'dining', label: '餐廳'}
                 ].map(t => (
                   <button 
                     key={t.id}
                     onClick={() => setType(t.id as BookingType)}
                     className={`flex-1 py-2 rounded-xl text-sm font-bold border ${type === t.id ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}
                   >
                     {t.label}
                   </button>
                 ))}
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">標題 (名稱)</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="例如：飯店名稱 / 航空公司" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">副標題 (詳細資訊)</label>
              <input value={subTitle} onChange={e => setSubTitle(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="例如：JX804 / 3晚" />
            </div>

            {type === 'flight' && (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-stone-500 mb-1">出發地</label>
                        <input value={flightFrom} onChange={e => setFlightFrom(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 uppercase" placeholder="TPE" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-stone-500 mb-1">目的地</label>
                        <input value={flightTo} onChange={e => setFlightTo(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 uppercase" placeholder="NRT" />
                    </div>
                </div>
            )}
            
            {type !== 'flight' && (
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1">地址 / 地點</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="輸入地址以連結地圖" />
                </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-500 mb-1">日期</label>
                <input value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="YYYY/MM/DD" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-500 mb-1">時間</label>
                <input value={time} onChange={e => setTime(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="HH:MM" />
              </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-stone-500 mb-1">圖片 (自動壓縮)</label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100">
                    <Upload size={20} className="text-stone-400" />
                    <span className="text-sm text-stone-500 truncate">{imageFile ? '圖片已載入' : '上傳圖片'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {imageFile && <img src={imageFile} alt="Preview" className="h-20 rounded-lg mt-2 object-cover border border-stone-200" />}
            </div>

            <button onClick={handleSave} className="w-full py-4 bg-stone-800 text-white font-bold rounded-xl mt-4 shadow-md active:scale-95 transition-transform">
              下一步
            </button>
         </div>
         )}
      </div>
    </div>
  );
};

export default BookingsView;
