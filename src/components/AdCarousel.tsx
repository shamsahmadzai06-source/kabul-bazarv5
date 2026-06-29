import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ads = [
  { id: '1', image: '/images/ad1.jpg', link: '#' },
  { id: '2', image: '/images/post5.jpg', link: '#' },
  { id: '3', image: '/images/post3.jpg', link: '#' },
];

export function AdCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % ads.length), []);
  const prev = () => setCurrent((c) => (c - 1 + ads.length) % ads.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full h-[140px] rounded-xl overflow-hidden mb-3">
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {ads.map((ad) => (
          <div key={ad.id} className="w-full h-full shrink-0">
            <img
              src={ad.image}
              alt="Ad"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {ads.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? 'bg-white w-4' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
