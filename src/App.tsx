import { useState, useEffect, useRef, useCallback } from 'react';

interface Deck {
  id: 'A' | 'B';
  isPlaying: boolean;
  bpm: number;
  volume: number;
  pitch: number;
  rotation: number;
  eq: { low: number; mid: number; high: number };
  effect: 'none' | 'echo' | 'reverb' | 'filter';
  effectIntensity: number;
}

const initialDeck = (id: 'A' | 'B'): Deck => ({
  id,
  isPlaying: false,
  bpm: 128,
  volume: 75,
  pitch: 0,
  rotation: 0,
  eq: { low: 50, mid: 50, high: 50 },
  effect: 'none',
  effectIntensity: 50,
});

function Knob({ value, onChange, label, color = 'cyan' }: { value: number; onChange: (v: number) => void; label: string; color?: string }) {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = startY.current - e.clientY;
    const newValue = Math.max(0, Math.min(100, startValue.current + delta * 0.5));
    onChange(newValue);
  }, [onChange]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const rotation = (value / 100) * 270 - 135;
  const colorMap: Record<string, string> = {
    cyan: '#00f7ff',
    magenta: '#ff00ff',
    yellow: '#ffff00',
    green: '#00ff88',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          isDragging.current = true;
          startY.current = touch.clientY;
          startValue.current = value;
        }}
        onTouchMove={(e) => {
          if (!isDragging.current) return;
          const touch = e.touches[0];
          const delta = startY.current - touch.clientY;
          const newValue = Math.max(0, Math.min(100, startValue.current + delta * 0.5));
          onChange(newValue);
        }}
        onTouchEnd={() => { isDragging.current = false; }}
        className="relative w-10 h-10 md:w-12 md:h-12 rounded-full cursor-ns-resize select-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, #444, #1a1a1a)`,
          boxShadow: `0 0 10px ${colorMap[color]}40, inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="absolute w-1 h-4 rounded-full left-1/2 -translate-x-1/2 top-1"
          style={{
            background: colorMap[color],
            boxShadow: `0 0 8px ${colorMap[color]}`,
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: 'center 18px',
          }}
        />
        <div
          className="absolute inset-1 rounded-full"
          style={{
            background: `conic-gradient(from -135deg, ${colorMap[color]}00, ${colorMap[color]}80 ${(value / 100) * 270}deg, ${colorMap[color]}00 ${(value / 100) * 270}deg)`,
            opacity: 0.3,
          }}
        />
      </div>
      <span className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Fader({ value, onChange, label, vertical = true }: { value: number; onChange: (v: number) => void; label: string; vertical?: boolean }) {
  return (
    <div className={`flex ${vertical ? 'flex-col items-center gap-2' : 'items-center gap-3'}`}>
      <span className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</span>
      <div
        className={`relative ${vertical ? 'w-3 md:w-4 h-24 md:h-32' : 'w-full h-3 md:h-4'} bg-black/60 rounded-full overflow-hidden`}
        style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)' }}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`absolute ${vertical ? 'w-24 md:w-32 h-3 md:h-4 -rotate-90 origin-left translate-y-full' : 'w-full h-full'} opacity-0 cursor-pointer`}
          style={vertical ? { top: '50%', left: '50%', transform: 'translateX(-50%) translateY(50%) rotate(-90deg)' } : {}}
        />
        <div
          className={`absolute ${vertical ? 'w-full bottom-0' : 'h-full left-0'} rounded-full transition-all`}
          style={{
            [vertical ? 'height' : 'width']: `${value}%`,
            background: 'linear-gradient(to top, #00f7ff, #00f7ff80)',
            boxShadow: '0 0 10px #00f7ff',
          }}
        />
      </div>
      <span className="text-[10px] md:text-xs font-mono text-cyan-400">{value}</span>
    </div>
  );
}

function VUMeter({ level }: { level: number }) {
  const bars = 12;
  return (
    <div className="flex gap-0.5 h-16 md:h-20 items-end">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i / bars) * 100;
        const active = level > threshold;
        const color = i < 7 ? '#00ff88' : i < 10 ? '#ffff00' : '#ff3333';
        return (
          <div
            key={i}
            className="w-1.5 md:w-2 rounded-sm transition-all duration-75"
            style={{
              height: `${30 + i * 5}%`,
              background: active ? color : '#222',
              boxShadow: active ? `0 0 8px ${color}` : 'none',
              opacity: active ? 1 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
}

function Turntable({ deck, onTogglePlay, onBpmChange }: { deck: Deck; onTogglePlay: () => void; onBpmChange: (bpm: number) => void }) {
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (deck.isPlaying) {
      const rpm = deck.bpm / 4;
      const degreesPerFrame = (rpm * 6) / 60;

      const animate = () => {
        setRotation(r => (r + degreesPerFrame) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [deck.isPlaying, deck.bpm]);

  const deckColor = deck.id === 'A' ? '#00f7ff' : '#ff00ff';

  return (
    <div className="relative flex flex-col items-center">
      {/* Platter */}
      <div
        className="relative w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0a0a0a 100%)`,
          boxShadow: `0 0 30px ${deckColor}20, inset 0 0 60px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Vinyl */}
        <div
          className="absolute inset-4 md:inset-6 rounded-full cursor-pointer"
          onClick={onTogglePlay}
          style={{
            background: `
              repeating-radial-gradient(
                circle at center,
                #111 0px,
                #1a1a1a 1px,
                #111 2px
              )
            `,
            transform: `rotate(${rotation}deg)`,
            transition: deck.isPlaying ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Label */}
          <div
            className="absolute inset-[30%] rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${deckColor}40, ${deckColor}10)`,
              boxShadow: `0 0 20px ${deckColor}30`,
            }}
          >
            <span
              className="text-lg md:text-2xl font-bold font-display"
              style={{ color: deckColor, textShadow: `0 0 10px ${deckColor}` }}
            >
              {deck.id}
            </span>
          </div>
          {/* Grooves highlight */}
          <div
            className="absolute inset-[15%] rounded-full pointer-events-none"
            style={{
              background: `linear-gradient(45deg, transparent 40%, ${deckColor}10 50%, transparent 60%)`,
            }}
          />
        </div>
        {/* Tonearm */}
        <div
          className="absolute -right-2 md:-right-4 top-2 md:top-4 w-16 md:w-24 h-2 origin-right"
          style={{
            background: 'linear-gradient(to left, #666, #333)',
            transform: deck.isPlaying ? 'rotate(-25deg)' : 'rotate(-5deg)',
            transition: 'transform 0.5s ease-out',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute left-0 w-3 h-3 md:w-4 md:h-4 bg-gray-700 rounded-sm -translate-y-1/4" />
        </div>
        {/* Play indicator */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300"
          style={{
            background: deck.isPlaying ? '#00ff88' : '#333',
            boxShadow: deck.isPlaying ? '0 0 15px #00ff88' : 'none',
          }}
        />
      </div>

      {/* BPM Control */}
      <div className="mt-3 md:mt-4 flex items-center gap-2 md:gap-4">
        <button
          onClick={() => onBpmChange(Math.max(60, deck.bpm - 1))}
          className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-800 text-cyan-400 font-bold hover:bg-gray-700 active:scale-95 transition-all"
        >
          -
        </button>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-mono font-bold" style={{ color: deckColor, textShadow: `0 0 10px ${deckColor}` }}>
            {deck.bpm}
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">BPM</div>
        </div>
        <button
          onClick={() => onBpmChange(Math.min(200, deck.bpm + 1))}
          className="w-7 h-7 md:w-8 md:h-8 rounded bg-gray-800 text-cyan-400 font-bold hover:bg-gray-700 active:scale-95 transition-all"
        >
          +
        </button>
      </div>
    </div>
  );
}

function DeckControls({ deck, onUpdate }: { deck: Deck; onUpdate: (updates: Partial<Deck>) => void }) {
  const deckColor = deck.id === 'A' ? 'cyan' : 'magenta';

  return (
    <div className="flex flex-col gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-gray-800">
      {/* EQ Section */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Knob
          value={deck.eq.high}
          onChange={(v) => onUpdate({ eq: { ...deck.eq, high: v } })}
          label="HI"
          color={deckColor}
        />
        <Knob
          value={deck.eq.mid}
          onChange={(v) => onUpdate({ eq: { ...deck.eq, mid: v } })}
          label="MID"
          color={deckColor}
        />
        <Knob
          value={deck.eq.low}
          onChange={(v) => onUpdate({ eq: { ...deck.eq, low: v } })}
          label="LO"
          color={deckColor}
        />
      </div>

      {/* Effects */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 flex-wrap">
          {(['none', 'echo', 'reverb', 'filter'] as const).map((fx) => (
            <button
              key={fx}
              onClick={() => onUpdate({ effect: fx })}
              className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs uppercase font-mono rounded transition-all ${
                deck.effect === fx
                  ? 'bg-gradient-to-r from-cyan-500/30 to-magenta-500/30 text-white'
                  : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
              }`}
              style={deck.effect === fx ? { boxShadow: `0 0 10px ${deck.id === 'A' ? '#00f7ff' : '#ff00ff'}40` } : {}}
            >
              {fx === 'none' ? 'OFF' : fx}
            </button>
          ))}
        </div>
        {deck.effect !== 'none' && (
          <Knob
            value={deck.effectIntensity}
            onChange={(v) => onUpdate({ effectIntensity: v })}
            label="FX AMT"
            color="yellow"
          />
        )}
      </div>
    </div>
  );
}

function Crossfader({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs md:max-w-md mx-auto">
      <div className="flex justify-between w-full px-2">
        <span className="text-sm md:text-base font-bold text-cyan-400" style={{ textShadow: '0 0 10px #00f7ff' }}>A</span>
        <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Crossfader</span>
        <span className="text-sm md:text-base font-bold text-fuchsia-400" style={{ textShadow: '0 0 10px #ff00ff' }}>B</span>
      </div>
      <div className="relative w-full h-6 md:h-8 bg-black/60 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-l-full"
          style={{
            width: `${value}%`,
            background: 'linear-gradient(to right, #00f7ff, #00f7ff00)',
            opacity: 0.3,
          }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-r-full"
          style={{
            width: `${100 - value}%`,
            background: 'linear-gradient(to left, #ff00ff, #ff00ff00)',
            opacity: 0.3,
          }}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 rounded-full pointer-events-none"
          style={{
            left: `calc(${value}% - 10px)`,
            background: 'linear-gradient(135deg, #fff, #888)',
            boxShadow: '0 0 15px #00f7ff80, 0 0 15px #ff00ff80',
          }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [deckA, setDeckA] = useState<Deck>(initialDeck('A'));
  const [deckB, setDeckB] = useState<Deck>(initialDeck('B'));
  const [crossfader, setCrossfader] = useState(50);
  const [masterVolume, setMasterVolume] = useState(80);
  const [simulatedLevelA, setSimulatedLevelA] = useState(0);
  const [simulatedLevelB, setSimulatedLevelB] = useState(0);

  // Simulate audio levels
  useEffect(() => {
    const interval = setInterval(() => {
      if (deckA.isPlaying) {
        setSimulatedLevelA(Math.random() * 40 + 40 + (deckA.volume - 50) * 0.5);
      } else {
        setSimulatedLevelA(0);
      }
      if (deckB.isPlaying) {
        setSimulatedLevelB(Math.random() * 40 + 40 + (deckB.volume - 50) * 0.5);
      } else {
        setSimulatedLevelB(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [deckA.isPlaying, deckA.volume, deckB.isPlaying, deckB.volume]);

  const updateDeckA = (updates: Partial<Deck>) => setDeckA(d => ({ ...d, ...updates }));
  const updateDeckB = (updates: Partial<Deck>) => setDeckB(d => ({ ...d, ...updates }));

  return (
    <div className="min-h-screen bg-[#050508] text-white font-body overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-transparent to-fuchsia-900/10" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #fff 1px, transparent 1px),
              linear-gradient(to bottom, #fff 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)',
          }}
        />
        {/* Glow spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-4 md:p-6 text-center">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-wider">
            <span className="text-cyan-400" style={{ textShadow: '0 0 30px #00f7ff' }}>NEON</span>
            <span className="text-white mx-2 md:mx-3">MIX</span>
            <span className="text-fuchsia-400" style={{ textShadow: '0 0 30px #ff00ff' }}>PRO</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-2 font-mono uppercase tracking-[0.2em]">Virtual DJ Console</p>
        </header>

        {/* DJ Console */}
        <main className="flex-1 p-3 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Decks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
              {/* Deck A */}
              <div className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-cyan-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 md:gap-4 self-start">
                  <div className="px-3 py-1 md:px-4 md:py-1.5 bg-cyan-500/20 rounded text-cyan-400 font-display font-bold text-sm md:text-base" style={{ textShadow: '0 0 10px #00f7ff' }}>
                    DECK A
                  </div>
                  <VUMeter level={simulatedLevelA * (crossfader <= 50 ? 1 : (100 - crossfader) / 50)} />
                </div>
                <Turntable
                  deck={deckA}
                  onTogglePlay={() => updateDeckA({ isPlaying: !deckA.isPlaying })}
                  onBpmChange={(bpm) => updateDeckA({ bpm })}
                />
                <div className="flex items-end gap-4 md:gap-6">
                  <Fader
                    value={deckA.volume}
                    onChange={(v) => updateDeckA({ volume: v })}
                    label="VOL"
                  />
                  <DeckControls deck={deckA} onUpdate={updateDeckA} />
                </div>
              </div>

              {/* Deck B */}
              <div className="flex flex-col items-center gap-4 md:gap-6 p-4 md:p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-fuchsia-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 md:gap-4 self-start">
                  <div className="px-3 py-1 md:px-4 md:py-1.5 bg-fuchsia-500/20 rounded text-fuchsia-400 font-display font-bold text-sm md:text-base" style={{ textShadow: '0 0 10px #ff00ff' }}>
                    DECK B
                  </div>
                  <VUMeter level={simulatedLevelB * (crossfader >= 50 ? 1 : crossfader / 50)} />
                </div>
                <Turntable
                  deck={deckB}
                  onTogglePlay={() => updateDeckB({ isPlaying: !deckB.isPlaying })}
                  onBpmChange={(bpm) => updateDeckB({ bpm })}
                />
                <div className="flex items-end gap-4 md:gap-6">
                  <Fader
                    value={deckB.volume}
                    onChange={(v) => updateDeckB({ volume: v })}
                    label="VOL"
                  />
                  <DeckControls deck={deckB} onUpdate={updateDeckB} />
                </div>
              </div>
            </div>

            {/* Mixer Section */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 p-4 md:p-6 rounded-2xl bg-gradient-to-r from-cyan-900/10 via-gray-900/60 to-fuchsia-900/10 border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center gap-4 md:gap-6">
                <Knob
                  value={masterVolume}
                  onChange={setMasterVolume}
                  label="MASTER"
                  color="green"
                />
                <div className="flex gap-1">
                  <VUMeter level={((simulatedLevelA * (crossfader <= 50 ? 1 : (100 - crossfader) / 50) + simulatedLevelB * (crossfader >= 50 ? 1 : crossfader / 50)) / 2) * (masterVolume / 100)} />
                  <VUMeter level={((simulatedLevelA * (crossfader <= 50 ? 1 : (100 - crossfader) / 50) + simulatedLevelB * (crossfader >= 50 ? 1 : crossfader / 50)) / 2) * (masterVolume / 100)} />
                </div>
              </div>
              <Crossfader value={crossfader} onChange={setCrossfader} />
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => {
                    updateDeckA({ isPlaying: true });
                    updateDeckB({ isPlaying: true });
                  }}
                  className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 rounded-lg font-display font-bold text-sm md:text-base uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
                  style={{ boxShadow: '0 0 20px rgba(0,247,255,0.3), 0 0 20px rgba(255,0,255,0.3)' }}
                >
                  SYNC PLAY
                </button>
                <button
                  onClick={() => {
                    updateDeckA({ isPlaying: false });
                    updateDeckB({ isPlaying: false });
                  }}
                  className="px-4 py-2 md:px-6 md:py-3 bg-gray-800 rounded-lg font-display font-bold text-sm md:text-base uppercase tracking-wider text-red-400 hover:bg-gray-700 hover:scale-105 active:scale-95 transition-all"
                >
                  STOP ALL
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-gray-600 text-xs font-mono">
            Requested by <span className="text-gray-500">@r3b000t</span> · Built by <span className="text-gray-500">@clonkbot</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
