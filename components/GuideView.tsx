import React, { useState, useEffect, useRef } from 'react';
import { useTripContext } from '../contexts/TripContext';
import { GuideLocation } from '../types';
import { Lock, Unlock, Plus, Trash2, X, Upload, MapPin, Calendar, Hash, Pencil } from 'lucide-react';

const PIN_CODE = '0000';

interface Props {
  highlightId?: string | null;
}

const GuideView: React.FC<Props> = ({ highlightId }) => {
  const { guideSpots, addGuideSpot, deleteGuideSpot, updateGuideSpot, itinerary } = useTripContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GuideLocation | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Date Selection
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get unique dates from guide spots or itinerary to build tabs
  const dates = itinerary.map(day => ({
      date: day.date,
      fullDate: day.fullDate,
      dayOfWeek: day.dayOfWeek
  }));

  const selectedDate = dates[selectedDateIndex]?.date;
  const currentSpots = guideSpots.filter(spot => spot.date === selectedDate);
  const quickLinks = Array.from(new Set(currentSpots.map(s => s.title)));

  useEffect(() => {
    if (highlightId) {
      const spot = guideSpots.find(s => s.id === highlightId);
      if (spot && spot.date) {
          const idx = dates.findIndex(d => d.date === spot.date);
          if (idx !== -1) setSelectedDateIndex(idx);
      }

      setTimeout(() => {
        const element = document.getElementById(highlightId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [highlightId, guideSpots]);

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

  const handleScrollTo = (title: string) => {
      const spot = currentSpots.find(s => s.title === title);
      if (spot) {
          const el = document.getElementById(spot.id);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  const handleDelete = (id: string) => {
      setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
      if (deleteConfirmId) {
          deleteGuideSpot(deleteConfirmId);
          setDeleteConfirmId(null);
      }
  };

  const handleAddNew = () => {
      setEditingItem(null);
      setShowModal(true);
  };

  const handleEdit = (item: GuideLocation) => {
      setEditingItem(item);
      setShowModal(true);
  };

  const handleSave = (item: GuideLocation) => {
      if (editingItem) {
          updateGuideSpot(item);
      } else {
          addGuideSpot(item);
      }
      setShowModal(false);
      setEditingItem(null);
  };

  return (
    <div className="pb-24 pt-4 animate-in fade-in duration-500 min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 mb-4 flex justify-between items-center sticky top-0 z-30 bg-muji-bg pt-2 pb-2">
         <div>
            <h2 className="text-2xl font-bold tracking-widest text-stone-800">深度導覽</h2>
            <div className="w-10 h-1 bg-emerald-300 mt-1 rounded-full"></div>
         </div>
         <button 
             onClick={handleUnlock}
             className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-stone-800 text-white shadow-md' : 'text-stone-300'}`}
          >
             {isEditing ? <Unlock size={18} /> : <Lock size={18} />}
          </button>
      </div>

      {/* Date Navigation */}
      <div className="sticky top-14 z-20 bg-muji-bg/95 backdrop-blur-sm pb-2 border-b border-stone-200/50">
          <div ref={scrollContainerRef} className="flex overflow-x-auto no-scrollbar px-4 gap-3 snap-x">
              {dates.map((day, idx) => {
                  const isSelected = idx === selectedDateIndex;
                  return (
                      <button
                          key={idx}
                          onClick={() => setSelectedDateIndex(idx)}
                          className={`snap-center flex-shrink-0 flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-2xl transition-all duration-300 border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105' : 'bg-white text-stone-500 border-stone-200'}`}
                      >
                          <span className="text-[10px] font-medium uppercase">{day.dayOfWeek}</span>
                          <span className="text-sm font-bold font-mono">{day.date}</span>
                      </button>
                  );
              })}
              <div className="w-2" />
          </div>
      </div>

      {/* Quick Links */}
      {currentSpots.length > 0 && (
          <div className="px-4 py-4 flex flex-wrap gap-2">
              {quickLinks.map(title => (
                  <button 
                    key={title} 
                    onClick={() => handleScrollTo(title)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all"
                  >
                      {title}
                  </button>
              ))}
          </div>
      )}

      {/* Content */}
      <div className="px-4 space-y-8 mt-2">
          {currentSpots.length === 0 ? (
              <div className="text-center py-20 text-stone-400">
                  <p>尚無導覽資料</p>
                  {isEditing && (
                      <button onClick={handleAddNew} className="mt-4 text-emerald-600 font-bold underline">
                          新增一個景點
                      </button>
                  )}
              </div>
          ) : (
             currentSpots.map((spot) => (
                <article 
                  key={spot.id} 
                  id={spot.id}
                  className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all duration-500 scroll-mt-32 ${highlightId === spot.id ? 'ring-4 ring-emerald-200 border-emerald-400 scale-[1.02]' : 'border-stone-100'}`}
                >
                  <div className="relative h-56 bg-stone-200 group">
                    <img 
                      src={spot.imageUrl} 
                      alt={spot.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-xs font-bold opacity-90 tracking-widest uppercase bg-black/20 backdrop-blur-sm px-2 py-1 rounded w-fit mb-1">{spot.subtitle}</div>
                      <h3 className="text-2xl font-bold">{spot.title}</h3>
                    </div>
                    {isEditing && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(spot.id); }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(spot); }}
                                className="absolute top-2 right-12 bg-stone-800 text-white p-2 rounded-full shadow-lg opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                            >
                                <Pencil size={16} />
                            </button>
                        </>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {spot.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-md">#{tag}</span>
                      ))}
                    </div>
                    
                    <p className="text-stone-600 leading-relaxed text-justify text-sm">
                      {spot.description}
                    </p>
                  </div>
                </article>
             ))
          )}
      </div>

      {isEditing && (
        <button 
          onClick={handleAddNew}
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
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full text-red-500 mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-stone-800">確定要刪除嗎？</h3>
                    <p className="text-sm text-stone-500 mt-2">此動作無法復原。</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-600 font-bold">取消</button>
                    <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">刪除</button>
                </div>
            </div>
        </div>
      )}

      {showModal && (
          <GuideFormModal 
            onClose={() => setShowModal(false)} 
            onSave={handleSave} 
            defaultDate={selectedDate || '12/17'}
            dates={dates.map(d => d.date)}
            initialData={editingItem}
          />
      )}
    </div>
  );
};

const GuideFormModal: React.FC<{ 
    onClose: () => void, 
    onSave: (item: GuideLocation) => void,
    defaultDate: string,
    dates: string[],
    initialData: GuideLocation | null
}> = ({ onClose, onSave, defaultDate, dates, initialData }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || defaultDate);
    const [tagInput, setTagInput] = useState(initialData?.tags.join(', ') || '');
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
    
    const [isConfirming, setIsConfirming] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
                setImageUrl(reader.result as string);
            } catch (error) {
                alert("圖片過大！");
            }
          };
          reader.readAsDataURL(file);
        }
      };

    const handleSave = () => {
        if (!title || !description) return;
        
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        onSave({
            id: initialData?.id || Date.now().toString(),
            date,
            title,
            subtitle: subtitle || 'Spot',
            description,
            tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
            imageUrl
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl">{initialData ? '編輯深度導覽' : '新增深度導覽'}</h3>
                    <button onClick={onClose}><X size={24} className="text-stone-400" /></button>
                </div>
                
                {isConfirming ? (
                    <div className="text-center py-6">
                        <div className="mb-6 text-stone-600">
                            確定要{initialData ? '更新' : '新增'} <span className="font-bold text-stone-800">{title}</span> 嗎？
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
                                確定{initialData ? '更新' : '新增'}
                            </button>
                        </div>
                    </div>
                ) : (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">日期</label>
                        <select 
                           value={date} 
                           onChange={e => setDate(e.target.value)} 
                           className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50"
                        >
                            {dates.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">標題</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="景點名稱" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">副標題</label>
                        <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="英文名稱或短語" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">描述</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 h-32" placeholder="詳細介紹..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">標籤 (用逗號分隔)</label>
                        <input value={tagInput} onChange={e => setTagInput(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50" placeholder="美食, 夜景, 購物" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-stone-500 block mb-1">封面照片</label>
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100">
                            <Upload size={20} className="text-stone-400" />
                            <span className="text-sm text-stone-500 truncate">{imageUrl ? '圖片已選取' : '上傳圖片'}</span>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                        {imageUrl && <img src={imageUrl} alt="Preview" className="h-24 w-full object-cover rounded-lg mt-2 border border-stone-200" />}
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

export default GuideView;