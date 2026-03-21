'use client';
import { useEffect, useState } from 'react';

const images = [
  '/images/bg1.jpg',
  '/images/bg2.jpg',
  '/images/bg3.jpg'
];

export function BackgroundSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 15000); // Change image every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-[-2] bg-black">
        {images.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[3000ms] ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>
      {/* Dark/Light overlay for readability while keeping the glass UI vibrant */}
      <div className="fixed inset-0 z-[-1] bg-white/20 dark:bg-black/70 backdrop-blur-[2px] dark:backdrop-blur-sm transition-colors duration-1000" />
    </>
  );
}
