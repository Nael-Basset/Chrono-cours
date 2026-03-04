import { useState, useEffect } from 'react';
import { Play, Clock, Settings2, CheckCircle2, Moon, Sun, Maximize, Minimize } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  useEffect(() => {
    // Set default times on mount based on predefined slots
    const current = new Date();
    const nowMinutes = current.getHours() * 60 + current.getMinutes();
    
    let start = '08:15';
    let end = '09:45';
    
    if (nowMinutes < 585) { // Before 09:45
      start = '08:15'; end = '09:45';
    } else if (nowMinutes < 690) { // Before 11:30
      start = '10:00'; end = '11:30';
    } else if (nowMinutes < 770) { // Before 12:50
      start = '11:30'; end = '13:00';
    } else if (nowMinutes < 870) { // Before 14:30
      start = '13:00'; end = '14:30';
    } else if (nowMinutes < 975) { // Before 16:15
      start = '14:45'; end = '16:15';
    } else if (nowMinutes < 1080) { // Before 18:00
      start = '16:30'; end = '18:00';
    } else {
      start = '08:15'; end = '09:45';
    }
    
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

  const QUARTER_HOUR_MS = 15 * 60 * 1000;
  const numBars = Math.ceil(totalMs / QUARTER_HOUR_MS);
  
  const bars = Array.from({ length: numBars }).map((_, i) => {
    const barStartMs = i * QUARTER_HOUR_MS;
    const barDuration = Math.min((i + 1) * QUARTER_HOUR_MS, totalMs) - barStartMs;
    const barElapsed = Math.max(0, Math.min(elapsedMs - barStartMs, barDuration));
    
    // Each bar represents 15 minutes, but the session may end before the bar is full
    const fillPercentage = (barElapsed / QUARTER_HOUR_MS) * 100;
    const maxFillPercentage = (barDuration / QUARTER_HOUR_MS) * 100;
    
    return {
      id: i,
      fillPercentage,
      maxFillPercentage,
      isPlaceholder: false,
    };
  });

  const chunkedBars = [];
  const ITEMS_PER_ROW = 8;

  for (let i = 0; i < bars.length; i += ITEMS_PER_ROW) {
    chunkedBars.push(bars.slice(i, i + ITEMS_PER_ROW));
  }

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 overflow-hidden flex flex-col items-center justify-center p-4 md:p-12 transition-colors duration-300">
      <div className="flex flex-col landscape:flex-row md:flex-row gap-6 md:gap-16 items-center landscape:items-stretch md:items-stretch justify-center w-full h-full max-w-[1400px] mx-auto overflow-y-auto no-scrollbar">
        {/* Main Card */}
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none overflow-hidden border border-zinc-100 dark:border-zinc-800 shrink-0 landscape:max-h-full landscape:overflow-y-auto no-scrollbar relative flex flex-col justify-center">
          {/* Controls: Dark Mode & Fullscreen */}
          <div className="absolute top-2 right-2 md:top-6 md:right-6 flex gap-1.5 md:gap-3 z-10">
            <button
              onClick={toggleFullscreen}
              className="md:hidden p-1.5 md:p-3 rounded-lg md:rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 active:scale-95 transition-all border border-zinc-100 dark:border-zinc-700"
              title="Mode plein écran"
            >
              {isFullscreen ? <Minimize size={14} className="md:w-5 md:h-5" /> : <Maximize size={14} className="md:w-5 md:h-5" />}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 md:p-3 rounded-lg md:rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 active:scale-95 transition-all border border-zinc-100 dark:border-zinc-700"
              title="Changer le thème"
            >
              {isDarkMode ? <Sun size={14} className="md:w-5 md:h-5" /> : <Moon size={14} className="md:w-5 md:h-5" />}
            </button>
          </div>

          <div className="p-6 md:p-12">
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-6 md:mb-12">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock size={24} className="md:w-8 md:h-8" />
              </div>
              <h1 className="text-xl md:text-4xl font-semibold tracking-tight">Chrono Cours</h1>
            </div>

            <AnimatePresence mode="wait">
              {!isRunning ? (
                <motion.div 
                  key="setup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 md:space-y-10"
                >
                  <div className="space-y-4 md:space-y-10">
                    <div className="space-y-2 md:space-y-4">
                      <label className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Heure de début</label>
                      <input 
                        type="time" 
                        value={startTimeStr}
                        onChange={(e) => setStartTimeStr(e.target.value)}
                        className="w-full text-3xl md:text-6xl font-light tracking-tight border-b-2 border-zinc-100 dark:border-zinc-800 pb-2 md:pb-4 focus:border-indigo-500 focus:outline-none transition-colors bg-transparent"
                      />
                    </div>
                    
                    <div className="space-y-2 md:space-y-4">
                      <label className="text-xs md:text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Heure de fin</label>
                      <input 
                        type="time" 
                        value={endTimeStr}
                        onChange={(e) => setEndTimeStr(e.target.value)}
                        className="w-full text-3xl md:text-6xl font-light tracking-tight border-b-2 border-zinc-100 dark:border-zinc-800 pb-2 md:pb-4 focus:border-indigo-500 focus:outline-none transition-colors bg-transparent"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleStart}
                    className="w-full py-3 md:py-6 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white rounded-2xl md:rounded-3xl font-medium text-lg md:text-2xl transition-all flex items-center justify-center gap-2 md:gap-4 active:scale-[0.98] mt-4 md:mt-12"
                  >
                    <Play size={20} className="md:w-8 md:h-8" fill="currentColor" />
                    Démarrer
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
                  <div className="relative w-48 h-48 md:w-80 md:h-80 flex items-center justify-center mb-6 md:mb-12">
                    {/* Background Circle */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-zinc-100 dark:text-zinc-800"
                      />
                      {/* Progress Circle */}
                      <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="283%"
                        strokeDashoffset={`${283 - (progress * 2.83)}%`}
                        strokeLinecap="round"
                        className={`transition-all duration-300 ease-out ${isFinished ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      <span className="text-[10px] md:text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                        {isFinished ? 'Terminé' : 'Restant'}
                      </span>
                      {isFinished ? (
                        <CheckCircle2 className="w-10 h-10 md:w-24 md:h-24 text-emerald-500 my-1 md:my-4" />
                      ) : (
                        <span className="text-3xl md:text-7xl font-light tracking-tighter text-zinc-900 dark:text-zinc-100 tabular-nums">
                          {formatTime(remainingMs)}
                        </span>
                      )}
                      <button 
                        onClick={() => setPrecisionMode((prev) => (prev + 1) % 3)}
                        className="text-sm md:text-2xl font-medium text-zinc-500 dark:text-zinc-400 mt-1 md:mt-4 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer select-none"
                      >
                        {precisionMode === 0 
                          ? progress.toFixed(1) 
                          : precisionMode === 1 
                            ? progress.toFixed(2) 
                            : progress.toFixed(Math.max(0, Math.ceil(-Math.log10(150000 / (totalMs || 1)))))}%
                      </button>
                    </div>
                  </div>

                  <div className="w-full flex gap-3 md:gap-6">
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl md:rounded-3xl p-3 md:p-6 text-center border border-zinc-100 dark:border-zinc-800">
                      <div className="text-[10px] md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 md:mb-2">Début</div>
                      <div className="text-lg md:text-3xl font-medium text-zinc-700 dark:text-zinc-300">{startTimeStr}</div>
                    </div>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl md:rounded-3xl p-3 md:p-6 text-center border border-zinc-100 dark:border-zinc-800">
                      <div className="text-[10px] md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 md:mb-2">Fin</div>
                      <div className="text-lg md:text-3xl font-medium text-zinc-700 dark:text-zinc-300">{endTimeStr}</div>
                    </div>
                  </div>

                  <button 
                    onClick={handleStop}
                    className="mt-6 md:mt-12 w-full py-3 md:py-5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl md:rounded-3xl font-medium text-base md:text-xl transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-[0.98]"
                  >
                    <Settings2 size={18} className="md:w-6 md:h-6" />
                    Modifier les horaires
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bars Section */}
        <AnimatePresence>
          {isRunning && numBars > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 p-6 md:p-10 flex flex-col gap-4 md:gap-10 w-full max-w-full h-full max-h-[500px] md:max-h-full overflow-y-auto no-scrollbar"
            >
              <div className="flex flex-col gap-4 md:gap-10 h-full justify-center">
                {chunkedBars.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-4 md:gap-8 items-end justify-center h-full min-h-0">
                    {row.map((bar) => (
                      <div 
                        key={bar.id} 
                        className="flex-1 max-w-[40px] md:max-w-[64px] h-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative flex flex-col justify-end flex-shrink-1 [--bar-r:20px] md:[--bar-r:32px]"
                        title={`Quart d'heure ${Number(bar.id) + 1}${bar.maxFillPercentage < 100 ? ` (S'arrête à ${Math.round(bar.maxFillPercentage)}%)` : ''}`}
                      >
                        {/* Hatching for unreachable time */}
                        {bar.maxFillPercentage < 100 && (
                          <div 
                            className="absolute top-0 left-0 right-0 stripe-bg opacity-30 text-zinc-400 dark:text-zinc-500 overflow-hidden"
                            style={{ height: `calc(${100 - bar.maxFillPercentage}% + var(--bar-r))` }}
                          >
                            {/* Concave cutter - Centered on the bottom edge to peak exactly at maxFillPercentage with overlap fix */}
                            <div className="absolute bottom-0 left-0 w-full aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-full translate-y-[calc(50%-0.5px)]" />
                          </div>
                        )}
                        
                        {/* Progress bar */}
                        <div 
                          className={`w-full transition-all duration-500 ease-out rounded-full relative z-10 ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500 dark:bg-indigo-400'}`}
                          style={{ height: `${bar.fillPercentage}%` }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
