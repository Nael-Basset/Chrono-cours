import { useState, useEffect } from 'react';
import { Play, Clock, Settings2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function formatTime(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function App() {
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [now, setNow] = useState(new Date());
  const [precisionMode, setPrecisionMode] = useState(0); // 0: 1 decimal, 1: 2 decimals, 2: dynamic
  
  useEffect(() => {
    // Set default times on mount
    const current = new Date();
    const start = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
    
    const endDate = new Date(current.getTime() + 60 * 60 * 1000);
    const end = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    
    setStartTimeStr(start);
    setEndTimeStr(end);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setNow(new Date());
    }, 100); // 100ms for smooth progress
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStart = () => {
    if (!startTimeStr || !endTimeStr) return;
    setNow(new Date());
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  // Calculate progress
  let progress = 0;
  let remainingMs = 0;
  let isFinished = false;
  let totalMs = 0;
  let elapsedMs = 0;

  if (isRunning) {
    const startParts = startTimeStr.split(':').map(Number);
    const endParts = endTimeStr.split(':').map(Number);
    
    const startDate = new Date(now);
    startDate.setHours(startParts[0], startParts[1], 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(endParts[0], endParts[1], 0, 0);
    
    // Handle cases where end time is on the next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    totalMs = endDate.getTime() - startDate.getTime();
    elapsedMs = now.getTime() - startDate.getTime();
    
    if (now >= endDate) {
      progress = 100;
      remainingMs = 0;
      isFinished = true;
      elapsedMs = totalMs;
    } else if (now <= startDate) {
      progress = 0;
      remainingMs = totalMs;
      elapsedMs = 0;
    } else {
      progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      remainingMs = endDate.getTime() - now.getTime();
    }
  }

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const QUARTER_HOUR_MS = 15 * 60 * 1000;
  const numBars = Math.ceil(totalMs / QUARTER_HOUR_MS);
  
  const bars = Array.from({ length: numBars }).map((_, i) => {
    const barStartMs = i * QUARTER_HOUR_MS;
    const barEndMs = Math.min((i + 1) * QUARTER_HOUR_MS, totalMs);
    const barDuration = barEndMs - barStartMs;
    const barElapsed = Math.max(0, Math.min(elapsedMs - barStartMs, barDuration));
    const fillPercentage = (barElapsed / barDuration) * 100;
    const heightPercentage = (barDuration / QUARTER_HOUR_MS) * 100;
    
    return {
      id: i,
      fillPercentage,
      heightPercentage,
      isPlaceholder: false,
    };
  });

  const chunkedBars = [];
  for (let i = 0; i < bars.length; i += 8) {
    const chunk = bars.slice(i, i + 8);
    if (numBars > 8 && chunk.length < 8) {
      const padding = Array.from({ length: 8 - chunk.length }).map((_, j) => ({
        id: `placeholder-${i + j}`,
        fillPercentage: 0,
        heightPercentage: 0,
        isPlaceholder: true,
      }));
      chunkedBars.push([...chunk, ...padding]);
    } else {
      chunkedBars.push(chunk);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans text-zinc-900">
      <div className="flex flex-col md:flex-row gap-6 items-stretch w-full max-w-5xl justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-zinc-200/50 overflow-hidden border border-zinc-100 shrink-0">
          <div className="p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock size={24} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Chrono Cours</h1>
          </div>

          <AnimatePresence mode="wait">
            {!isRunning ? (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Heure de début</label>
                    <input 
                      type="time" 
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="w-full text-4xl font-light tracking-tight border-b-2 border-zinc-100 pb-2 focus:border-indigo-500 focus:outline-none transition-colors bg-transparent"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Heure de fin</label>
                    <input 
                      type="time" 
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="w-full text-4xl font-light tracking-tight border-b-2 border-zinc-100 pb-2 focus:border-indigo-500 focus:outline-none transition-colors bg-transparent"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleStart}
                  className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-8"
                >
                  <Play size={20} fill="currentColor" />
                  Démarrer le décompte
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="timer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                  {/* Background Circle */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                      cx="144"
                      cy="144"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-zinc-100"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="144"
                      cy="144"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={`transition-all duration-300 ease-out ${isFinished ? 'text-emerald-500' : 'text-indigo-600'}`}
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-1">
                      {isFinished ? 'Terminé' : 'Temps restant'}
                    </span>
                    {isFinished ? (
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 my-2" />
                    ) : (
                      <span className="text-5xl font-light tracking-tighter text-zinc-900 tabular-nums">
                        {formatTime(remainingMs)}
                      </span>
                    )}
                    <button 
                      onClick={() => setPrecisionMode((prev) => (prev + 1) % 3)}
                      className="text-lg font-medium text-zinc-500 mt-2 hover:text-zinc-700 transition-colors cursor-pointer select-none"
                      title="Changer la précision"
                    >
                      {precisionMode === 0 
                        ? progress.toFixed(1) 
                        : precisionMode === 1 
                          ? progress.toFixed(2) 
                          : progress.toFixed(Math.max(0, Math.ceil(-Math.log10(150000 / (totalMs || 1)))))}%
                    </button>
                  </div>
                </div>

                <div className="w-full flex gap-4">
                  <div className="flex-1 bg-zinc-50 rounded-2xl p-4 text-center border border-zinc-100">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Début</div>
                    <div className="text-xl font-medium text-zinc-700">{startTimeStr}</div>
                  </div>
                  <div className="flex-1 bg-zinc-50 rounded-2xl p-4 text-center border border-zinc-100">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Fin</div>
                    <div className="text-xl font-medium text-zinc-700">{endTimeStr}</div>
                  </div>
                </div>

                <button 
                  onClick={handleStop}
                  className="mt-8 w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-2xl font-medium text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Settings2 size={20} />
                  Modifier les horaires
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isRunning && numBars > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 flex flex-col gap-6 w-full max-w-md shrink-0 overflow-y-auto"
          >
            {chunkedBars.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-4 items-end flex-1 min-h-[120px]">
                {row.map((bar) => (
                  bar.isPlaceholder ? (
                    <div key={bar.id} className="flex-1 shrink-0" />
                  ) : (
                    <div 
                      key={bar.id} 
                      className="flex-1 bg-zinc-100 rounded-full overflow-hidden relative flex flex-col justify-end shrink-0"
                      style={{ height: `${bar.heightPercentage}%` }}
                      title={`Quart d'heure ${Number(bar.id) + 1}`}
                    >
                      <div 
                        className={`w-full transition-all duration-300 ease-out rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ height: `${bar.fillPercentage}%` }}
                      />
                    </div>
                  )
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
