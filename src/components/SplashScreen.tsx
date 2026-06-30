import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500); // Wait for fade animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0a1f3d 0%, #1a3a5c 50%, #0d2b4a 100%)',
      }}
    >
      {/* Animated wave background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(30, 100, 200, 0.3) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />
        </div>
        <div 
          className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
          style={{
            background: 'linear-gradient(to top, rgba(100, 180, 255, 0.3), transparent)',
            animation: 'wave 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <img
          src="/icons/logo.png"
          alt="Kabul Bazar"
          className="w-[120px] h-[120px] rounded-full object-cover animate-pulse"
        />
        <h1 className="mt-6 text-white text-[28px] font-bold tracking-[-0.5px]">
          Kabul Bazar
        </h1>
        <div className="mt-4 w-32 h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/60 rounded-full"
            style={{
              animation: 'loading 2.5s ease-out forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}