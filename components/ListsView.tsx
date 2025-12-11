import React, { useState, useRef } from 'react';
import { CheckSquare, Square, Plus, Trash2, Link as LinkIcon, AlertTriangle, Check, X, Download, Upload, Cloud, PlugZap, Loader2, CloudOff, RefreshCw, Trash } from 'lucide-react';
import { PackingItem } from '../types';
import { useTripContext } from '../contexts/TripContext';
import { FIREBASE_CONFIG } from '../constants';

const ListsView: React.FC = () => {
  const { 
      packingList, togglePackingItem, 
      memoList, addMemoItem, deleteMemoItem, toggleMemoItem,
      wishList, addWishItem, deleteWishItem, toggleWishItem,
      exportData, importData,
      isCloudMode, connectToCloud, disconnectCloud, connectionStatus
  } = useTripContext();

  const [activeSubTab, setActiveSubTab] = useState<'packing' | 'memo' | 'wish'>('packing');
  const [inputValue, setInputValue] = useState('');
  
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, type: 'memo' | 'wish'} | null>(null);
  const [isAddingConfirm, setIsAddingConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if config is hardcoded and valid
  const isHardcodedConfigValid = FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("請填入");

  const toggleGenericItem = (id: string, listType: 'memo' | 'wish') => {
    if (listType === 'memo') {
        toggleMemoItem(id);
    } else {
        toggleWishItem(id);
    }
  };

  const initiateAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim()) return;
      setIsAddingConfirm(true);
  };

  const confirmAddItem = () => {
    if (!inputValue.trim()) return;

    const newItem: PackingItem = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      checked: false
    };
    
    if (activeSubTab === 'memo') {
        addMemoItem(newItem);
    } else if (activeSubTab === 'wish') {
        addWishItem(newItem);
    }
    setInputValue('');
    setIsAddingConfirm(false);
  };

  const cancelAddItem = () => {
      setIsAddingConfirm(false);
  };

  const requestDelete = (id: string, e: React.MouseEvent, listType: 'memo' | 'wish') => {
    e.stopPropagation();
    setDeleteConfirm({ id, type: listType });
  };

  const confirmDelete = () => {
      if (!deleteConfirm) return;
      
      const { id, type } = deleteConfirm;
      if (type === 'memo') {
          deleteMemoItem(id);
      } else {
          deleteWishItem(id);
      }
      setDeleteConfirm(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!window.confirm("匯入資料將會覆蓋您目前的行程設定，確定要繼續嗎？")) {
          e.target.value = ''; // Reset
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const json = event.target?.result as string;
          const success = importData(json);
          if (success) {
             alert("匯入成功！");
          } else {
             alert("匯入失敗：檔案格式錯誤");
          }
      };
      reader.readAsText(file);
  };

  const handleRetryConnect = async () => {
       try {
          await connectToCloud(FIREBASE_CONFIG);
      } catch (e) {
          alert("連線失敗，請檢查 Config 是否正確");
      }
  };

  const handleManualConnect = async () => {
      if (FIREBASE_CONFIG.apiKey.includes("請填入") || !FIREBASE_CONFIG.apiKey) {
          alert("請先在程式碼中的 `constants.ts` 檔案填入 Firebase Config 設定！\n\n設定完成並部署後，網頁會自動連線。");
          return;
      }
      handleRetryConnect();
  };
  
  // New: Hard Reset Function
  const handleHardReset = () => {
      if (window.confirm("確定要重置嗎？\n\n這將會清除手機上的所有暫存資料，並強制從雲端重新下載。\n(不會刪除雲端上的資料)")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const isUrl = (text: string) => {
    return /^(http|https):\/\/[^ "]+$/.test(text);
  };

  const getActiveList = () => {
      if (activeSubTab === 'memo') return memoList;
      if (activeSubTab === 'wish') return wishList;
      return [];
  };

  return (
    <div className="pb-24 pt-4 px-4 h-full flex flex-col relative">
      <div className="flex p-1 bg-stone-200 rounded-2xl mb-6 flex-shrink-0">
        <button 
          onClick={() => setActiveSubTab('packing')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'packing' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}
        >
          必備清單
        </button>
        <button 
          onClick={() => setActiveSubTab('memo')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'memo' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}
        >
          備忘錄
        </button>
        <button 
          onClick={() => setActiveSubTab('wish')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'wish' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500'}`}
        >
          願望清單
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {activeSubTab === 'packing' ? (
          <div className="space-y-3 animate-in fade-in duration-300">
            {packingList.map(item => (
              <div 
                key={item.id} 
                onClick={() => togglePackingItem(item.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${item.checked ? 'bg-stone-100 border-stone-100 opacity-60' : 'bg-white border-stone-100 shadow-sm'}`}
              >
                <div className={`${item.checked ? 'text-stone-400' : 'text-muji-highlight'}`}>
                  {item.checked ? <CheckSquare size={24} /> : <Square size={24} />}
                </div>
                <span className={`text-lg ${item.checked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                  {item.text}
                </span>
              </div>
            ))}
            <div className="text-center text-xs text-stone-400 mt-8">
              Progress: {packingList.filter(i => i.checked).length} / {packingList.length}
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in duration-300">
             <form onSubmit={initiateAdd} className="flex gap-2 mb-6 relative">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={activeSubTab === 'wish' ? "輸入願望或商品網址..." : "輸入事項或網址..."}
                  className={`flex-1 p-4 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-muji-accent bg-white ${isAddingConfirm ? 'border-muji-highlight' : 'border-stone-200'}`}
                  disabled={isAddingConfirm}
                />
                
                {isAddingConfirm ? (
                     <div className="flex gap-2 animate-in slide-in-from-right">
                         <button 
                            type="button"
                            onClick={cancelAddItem}
                            className="bg-stone-200 text-stone-600 p-4 rounded-2xl hover:bg-stone-300 transition-colors"
                         >
                            <X size={24} />
                         </button>
                         <button 
                            type="button"
                            onClick={confirmAddItem}
                            className="bg-muji-highlight text-white p-4 rounded-2xl shadow-md hover:bg-amber-600 transition-colors"
                         >
                            <Check size={24} />
                         </button>
                     </div>
                ) : (
                    <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="bg-stone-800 text-white p-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"
                    >
                    <Plus size={24} />
                    </button>
                )}
             </form>
             
             {isAddingConfirm && (
                 <div className="text-center text-xs text-muji-highlight font-bold mb-4 animate-in fade-in">
                     請確認是否新增此項目？
                 </div>
             )}

            {getActiveList().length === 0 && (
              <div className="text-center text-stone-400 py-10">
                <p>{activeSubTab === 'wish' ? '尚未新增願望清單' : '尚未新增任何備忘事項'}</p>
              </div>
            )}

            {getActiveList().map(item => (
              <div 
                key={item.id} 
                onClick={() => toggleGenericItem(item.id, activeSubTab as 'memo' | 'wish')}
                className={`relative group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${item.checked ? 'bg-stone-100 border-stone-100 opacity-60' : 'bg-white border-stone-100 shadow-sm'}`}
              >
                <div className={`${item.checked ? 'text-stone-400' : 'text-muji-highlight'} flex-shrink-0`}>
                  {item.checked ? <CheckSquare size={24} /> : <Square size={24} />}
                </div>
                
                <div className={`flex-1 overflow-hidden ${item.checked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                  {isUrl(item.text) ? (
                    <a 
                      href={item.text} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline truncate w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkIcon size={16} />
                      <span className="truncate">{item.text}</span>
                    </a>
                  ) : (
                    <span className="break-words">{item.text}</span>
                  )}
                </div>

                <button 
                  onClick={(e) => requestDelete(item.id, e, activeSubTab as 'memo' | 'wish')}
                  className="p-2 text-stone-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-stone-200">
             <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 text-center">Data Management</h4>
             <div className="flex flex-col gap-3">
                 <div className="flex gap-3">
                    <button 
                        onClick={exportData}
                        className="flex-1 py-2 bg-white border border-stone-300 text-stone-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Download size={14} /> 匯出資料
                    </button>
                    <label className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform hover:bg-stone-200">
                        <Upload size={14} /> 匯入資料
                        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                 </div>
                 
                 {isHardcodedConfigValid ? (
                     // Automatic Mode UI
                     <div className={`w-full py-2 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                         connectionStatus === 'connected' ? 'bg-sky-50 border-sky-200 text-sky-600' : 
                         connectionStatus === 'error' ? 'bg-red-50 border-red-200 text-red-500' :
                         'bg-stone-50 border-stone-200 text-stone-400'
                     }`}>
                        {connectionStatus === 'connecting' ? <Loader2 className="animate-spin" size={14} /> : 
                         connectionStatus === 'connected' ? <Cloud size={14} /> : 
                         <AlertTriangle size={14} />}
                        
                        {connectionStatus === 'connecting' ? '自動連線中...' : 
                         connectionStatus === 'connected' ? '雲端同步已連線 (Auto)' : 
                         <button onClick={handleRetryConnect} className="underline hover:text-red-700">連線失敗，點此重試</button>}
                     </div>
                 ) : (
                    // Manual Mode UI (Legacy / Not Configured)
                    <button 
                        onClick={handleManualConnect}
                        disabled={connectionStatus === 'connecting'}
                        className={`w-full py-2 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform ${isCloudMode ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}
                    >
                        {connectionStatus === 'connecting' ? (
                            <Loader2 className="animate-spin" size={14} />
                        ) : isCloudMode ? (
                            <CloudOff size={14} />
                        ) : (
                            <Cloud size={14} />
                        )}
                        {connectionStatus === 'connecting' ? '連線中...' : isCloudMode ? '已連線 (點擊斷開)' : '啟用雲端同步'}
                    </button>
                 )}
                 
                 {/* Hard Reset Button */}
                 <button 
                    onClick={handleHardReset}
                    className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red-100 hover:bg-red-100 mt-2"
                 >
                     <RefreshCw size={14} /> 強制重置修復 (看圖片必點)
                 </button>
                 
                 {isCloudMode && isHardcodedConfigValid && (
                     <p className="text-[10px] text-sky-400 text-center px-2">
                        已自動連接至專案：{FIREBASE_CONFIG.projectId}
                     </p>
                 )}
             </div>
        </div>
      </div>

      {deleteConfirm && (
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
                          onClick={() => setDeleteConfirm(null)} 
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
    </div>
  );
};

export default ListsView;
