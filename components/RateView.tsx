import React, { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';

// Hardcoded approximate rate, in a real app fetch from API
const DEFAULT_RATE = 0.21; // 1 JPY = 0.21 TWD

const RateView: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [resultTwd, setResultTwd] = useState<number | null>(null);
  const [rate] = useState(DEFAULT_RATE);

  const handlePress = (val: string) => {
    setExpression(prev => prev + val);
  };

  const handleDelete = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression('');
    setResultTwd(null);
  };

  const calculate = () => {
    try {
      if (!/^[0-9+\-*/().\s]+$/.test(expression)) return;
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expression)();
      if (isFinite(result)) {
        setResultTwd(result * rate);
      }
    } catch (e) {
      console.error("Calculation error", e);
    }
  };

  useEffect(() => {
    if (expression.length === 0) {
      setResultTwd(0);
      return;
    }
    const timer = setTimeout(() => {
        try {
             if (!/^[0-9+\-*/().\s]+$/.test(expression)) return;
             // eslint-disable-next-line no-new-func
             const val = new Function('return ' + expression)();
             if(isFinite(val)) setResultTwd(val * rate);
        } catch(e) { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [expression, rate]);

  const btnClass = "flex-1 rounded-xl bg-white shadow-sm border border-stone-100 text-lg font-bold text-stone-600 active:bg-stone-100 active:scale-95 transition-all flex items-center justify-center";
  const opClass = "flex-1 rounded-xl bg-stone-100 shadow-sm border border-stone-200 text-lg font-bold text-muji-highlight active:bg-stone-200 active:scale-95 transition-all flex items-center justify-center";

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col p-4 animate-in zoom-in-95 duration-300">
      
      {/* Compact Display Screen */}
      <div className="bg-stone-800 rounded-2xl p-5 text-right mb-4 shadow-md flex-shrink-0">
        <div className="flex justify-between items-end mb-2">
           <span className="text-stone-400 text-xs">日幣 (JPY)</span>
           <div className="text-2xl text-white font-mono break-all">{expression || '0'}</div>
        </div>
        
        <div className="h-px bg-stone-600 mb-2"></div>
        
        <div className="flex justify-between items-end">
           <span className="text-stone-400 text-xs">台幣 (TWD)</span>
           <div className="text-3xl text-muji-highlight font-mono font-bold">
               {resultTwd ? Math.round(resultTwd).toLocaleString() : '0'}
           </div>
        </div>
        <div className="mt-2 text-[10px] text-stone-500 text-right">Rate: {rate}</div>
      </div>

      {/* Compact Keypad */}
      <div className="grid grid-cols-4 gap-2 flex-1 min-h-0">
        <button onClick={handleClear} className="col-span-1 rounded-xl bg-red-50 text-red-500 font-bold flex items-center justify-center text-lg">AC</button>
        <button onClick={handleDelete} className="col-span-1 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center"><Delete size={20}/></button>
        <button onClick={() => handlePress('/')} className={opClass}>÷</button>
        <button onClick={() => handlePress('*')} className={opClass}>×</button>

        <button onClick={() => handlePress('7')} className={btnClass}>7</button>
        <button onClick={() => handlePress('8')} className={btnClass}>8</button>
        <button onClick={() => handlePress('9')} className={btnClass}>9</button>
        <button onClick={() => handlePress('-')} className={opClass}>-</button>

        <button onClick={() => handlePress('4')} className={btnClass}>4</button>
        <button onClick={() => handlePress('5')} className={btnClass}>5</button>
        <button onClick={() => handlePress('6')} className={btnClass}>6</button>
        <button onClick={() => handlePress('+')} className={opClass}>+</button>

        <button onClick={() => handlePress('1')} className={btnClass}>1</button>
        <button onClick={() => handlePress('2')} className={btnClass}>2</button>
        <button onClick={() => handlePress('3')} className={btnClass}>3</button>
        <button onClick={calculate} className="row-span-2 rounded-xl bg-muji-primary text-white text-xl font-bold flex items-center justify-center shadow-md active:scale-95 transition-transform">=</button>

        <button onClick={() => handlePress('0')} className={`${btnClass} col-span-2`}>0</button>
        <button onClick={() => handlePress('.')} className={btnClass}>.</button>
      </div>
    </div>
  );
};

export default RateView;