import React, { useRef, useState, useEffect } from "react";
import type { TouchEvent } from "react";
import { motion } from "framer-motion";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const screenshots = [
    "screenshot1.webp",
    "screenshot2.webp",
    "screenshot3.webp"
  ];
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });

    const canvas = document.getElementById("particle-canvas") as HTMLCanvasElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const particles: { x: number; y: number; dx: number; dy: number; size: number }[] = [];
    const count = 60;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 0.7,
        dy: (Math.random() - 0.5) * 0.7,
        size: Math.random() * 2 + 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let p of particles) {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    isDragging.current = true;
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || startX.current === null) return;
    const deltaX = e.clientX - startX.current;
    if (deltaX > 50) {
      setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
      isDragging.current = false;
      document.body.style.cursor = "default";
    } else if (deltaX < -50) {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
      isDragging.current = false;
      document.body.style.cursor = "default";
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (startX.current === null) return;
    const deltaX = e.touches[0].clientX - startX.current;
    if (deltaX > 50) {
      setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
      startX.current = null;
    } else if (deltaX < -50) {
      setCurrentSlide((prev) => (prev + 1) % screenshots.length);
      startX.current = null;
    }
  };

  const handleMouseUp = () => {
    startX.current = null;
    isDragging.current = false;
    document.body.style.cursor = "default";
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white px-6 py-16 overflow-hidden">
      <canvas
        id="particle-canvas"
        className="absolute top-0 left-0 w-full h-full z-0"
        width={1920}
        height={1080}
      ></canvas>

      <div className="relative z-10 space-y-40">
        <motion.section
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-7xl font-extrabold tracking-tight mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 leading-tight pt-10 pb-4">
  Mods Manager
</h1>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
  <a
    href="https://github.com/azurich/Mods_Manager#readme"
    target="_blank"
    className="min-w-[200px] text-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 hover:brightness-110 hover:shadow-[0_0_12px_rgba(99,102,241,0.6)] rounded-full text-lg font-bold transition-all shadow-lg"
  >
    📘 Documentation
  </a>
  <a
    href="https://github.com/azurich/Mods_Manager/releases"
    target="_blank"
    className="min-w-[200px] text-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 hover:brightness-110 hover:shadow-[0_0_12px_rgba(16,185,129,0.6)] rounded-full text-lg font-bold transition-all shadow-lg"
  >
    📦 Télécharger
  </a>
  <a
    href="https://discord.gg/Hvvgh2CuvE"
    target="_blank"
    className="min-w-[200px] text-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 hover:brightness-110 hover:shadow-[0_0_12px_rgba(236,72,153,0.6)] rounded-full text-lg font-bold transition-all shadow-lg"
  >
    💬 Discord
  </a>
</div>
          
        </motion.section>

        <motion.section
          id="features"
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">Pourquoi utiliser Mods Manager ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:scale-[1.03] transition">
              <h3 className="text-xl font-semibold mb-2">💡 Simple et intuitif</h3>
              <p className="text-gray-300">Une interface pensée pour les joueurs qui veulent aller droit au but.</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:scale-[1.03] transition">
              <h3 className="text-xl font-semibold mb-2">⚙️ Personnalisable</h3>
              <p className="text-gray-300">Support de plusieurs jeux et profils pour s'adapter à chaque besoin.</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:scale-[1.03] transition">
              <h3 className="text-xl font-semibold mb-2">🚀 Gain de temps</h3>
              <p className="text-gray-300">Gérez tous vos mods en quelques clics, sans toucher aux fichiers manuellement.</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">Aperçu de l'application</h2>
          <div
            className="relative w-full max-w-5xl h-[500px] sm:h-[700px] mx-auto overflow-hidden rounded-2xl shadow-lg cursor-grab flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {screenshots.map((src, idx) => {
              const offset = idx - currentSlide;
              const isVisible = Math.abs(offset) <= 1;
              return (
                <img
                  key={idx}
                  src={src}
                  alt={`Capture ${idx + 1}`}
                  className={`absolute transition-all duration-500 ease-in-out rounded-xl select-none pointer-events-none ${
                    offset === 0 ? "z-20 scale-100 opacity-100" : "z-10 scale-95 opacity-60"
                  }`}
                  style={{
                    transform: `translateX(${offset * 100}%) scale(${offset === 0 ? 1 : 0.95})`,
                    opacity: isVisible ? (offset === 0 ? 1 : 0.6) : 0,
                    width: "60%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                  draggable={false}
                />
              );
            })}
          </div>

          <div className="flex justify-center mt-6 gap-2">
            {screenshots.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-3 h-3 rounded-full ${
                  currentSlide === i ? "bg-white" : "bg-gray-500"
                } transition-all`}
              />
            ))}
          </div>
        </motion.section>

        <motion.footer
          className="text-center text-sm text-gray-400 border-t border-gray-700 flex flex-col justify-center items-center min-h-[40px] py-1"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-base font-bold text-white"> Made by Azurich with 💖</div>
          <div className="text-gray-400 mt-1">Last updated: May 26th, 2025</div>
        </motion.footer>
      </div>
      <button
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white backdrop-blur transition-all shadow-lg"
    aria-label="Retour en haut"
  >
    ↑
  </button>
</main>
  );
}
