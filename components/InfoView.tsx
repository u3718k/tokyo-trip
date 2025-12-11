import React, { useRef } from 'react';
import { CloudRain, Phone, ShieldAlert, AlertCircle, Download, Upload } from 'lucide-react';
import { useTripContext } from '../contexts/TripContext';

const InfoView: React.FC = () => {
  const { exportData, importData } = useTripContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData();
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

  return (
    <div className="pb-24 pt-4 px-4 space-y-6 animate-in fade-in duration-500">
      
      {/* Weather */}
      <a 
        href="https://www.jma.go.jp/bosai/forecast/" 
        target="_blank" 
        rel="noreferrer"
        className="block bg-gradient-to-br from-blue-500 to-blue-400 rounded-3xl p-6 text-white shadow-md active:scale-95 transition-transform"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg flex items-center gap-2"><CloudRain size={20}/> 日本氣象廳</h3>
          <ExternalLinkIcon />
        </div>
        <p className="text-blue-50 text-sm opacity-90">點擊查看東京即時天氣預報</p>
      </a>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
        <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
          <Phone size={20} className="text-red-500"/> 緊急聯絡
        </h3>
        <div className="space-y-4">
          <ContactItem label="警察" number="110" />
          <ContactItem label="火警 / 救護車" number="119" />
          <ContactItem label="外交部旅外救助" number="+886-800-085-095" sub="(台灣直撥)" />
          <ContactItem label="駐日代表處" number="03-3280-7811" />
        </div>
      </div>

      {/* Travel Tips */}
      <div className="bg-stone-100 rounded-3xl p-6">
        <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
          <ShieldAlert size={20} className="text-stone-600"/> 注意事項
        </h3>
        <ul className="space-y-3 text-sm text-stone-600">
          <li className="flex gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>日本電壓為 100V，插座為雙平腳（與台灣相同），通常不需轉接頭。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>請勿攜帶肉類製品入境。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>室外請勿邊走邊吃，請在定點食用完畢。</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500 font-bold">•</span>
            <span>搭乘手扶梯請遵循當地習慣（東京通常靠左站立）。</span>
          </li>
        </ul>
      </div>

      {/* Data Management - Solution for Multi-user */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
          <h3 className="font-bold text-lg text-stone-800 mb-2 flex items-center gap-2">
             <AlertCircle size={20} className="text-muji-highlight"/> 資料管理
          </h3>
          <p className="text-xs text-stone-500 mb-4 leading-relaxed">
             本網頁為純前端運作，資料儲存於本機。若要與他人分享行程，請使用匯出功能產生檔案，並傳送給對方匯入。
          </p>
          <div className="flex gap-3">
              <button 
                onClick={handleExport}
                className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                  <Download size={18} /> 匯出資料
              </button>
              <label className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform hover:bg-stone-200">
                  <Upload size={18} /> 匯入資料
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
          </div>
      </div>

       <div className="text-center text-xs text-stone-300 pt-8 pb-4">
        Designed for Japan Trip 2024
      </div>
    </div>
  );
};

const ContactItem = ({ label, number, sub }: { label: string, number: string, sub?: string }) => (
  <div className="flex justify-between items-center border-b border-stone-100 pb-2 last:border-0 last:pb-0">
    <span className="text-stone-600 font-medium">{label}</span>
    <div className="text-right">
      <a href={`tel:${number}`} className="text-blue-600 font-bold font-mono text-lg block">{number}</a>
      {sub && <span className="text-xs text-stone-400">{sub}</span>}
    </div>
  </div>
);

const ExternalLinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);

export default InfoView;