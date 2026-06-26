import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export function WinnerModal({ bolao, ranking, loggedUser, onClose }) {
  // O bolão deve estar finalizado e deve haver um ranking
  const isFinished = bolao?.status === 'FINISHED';
  const hasRanking = ranking && ranking.length > 0;
  const userRankPosition = hasRanking ? ranking.findIndex(u => u.id === loggedUser?.id) : -1;

  // Se não tem posição no ranking ou o bolão não finalizou, não renderiza
  if (!isFinished || userRankPosition === -1) return null;

  const isFirst = userRankPosition === 0;
  const isSecond = userRankPosition === 1;
  const isThird = userRankPosition === 2;
  const isOther = userRankPosition > 2;
  
  const userScore = ranking[userRankPosition].total_points;

  useEffect(() => {
    // Apenas dispara confetes intensos para o 1º lugar
    // e confetes mais leves para 2º e 3º. Nada para os demais.
    if (isOther) return;

    const duration = isFirst ? 5 * 1000 : 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    let colors = ['#facc15', '#04d361', '#ffffff']; // Cores do 1º (Ouro/Verde)
    if (isSecond) colors = ['#e5e7eb', '#9ca3af', '#ffffff']; // Cores do 2º (Prata)
    if (isThird) colors = ['#f97316', '#fdba74', '#ffffff']; // Cores do 3º (Bronze)

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = (isFirst ? 50 : 20) * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: colors
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: colors
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isFirst, isSecond, isThird, isOther]);

  // Configurações visuais baseadas na posição
  let config = {};
  if (isFirst) {
    config = {
      emoji: '🏆',
      title: 'Você é o Campeão!',
      titleColor: 'from-yellow-300 to-yellow-500',
      border: 'border-yellow-400/50',
      gradient: 'from-yellow-500/20',
      shadow: 'shadow-[0_0_50px_rgba(250,204,21,0.3)]',
      glow: 'rgba(250,204,21,0.15)',
      button: 'from-yellow-500 to-yellow-400 text-dark-900',
      buttonShadow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]',
      buttonText: 'Receber Troféu 🏅',
      message: `O bolão "${bolao.name}" chegou ao fim e ninguém palpitou melhor que você! Um verdadeiro gênio da bola.`
    };
  } else if (isSecond) {
    config = {
      emoji: '🥈',
      title: 'Quase Lá! Vice-Campeão',
      titleColor: 'from-gray-300 to-gray-400',
      border: 'border-gray-400/50',
      gradient: 'from-gray-500/20',
      shadow: 'shadow-[0_0_50px_rgba(156,163,175,0.3)]',
      glow: 'rgba(156,163,175,0.15)',
      button: 'from-gray-400 to-gray-500 text-dark-900',
      buttonShadow: 'shadow-[0_0_20px_rgba(156,163,175,0.4)]',
      buttonText: 'Comemorar Prata 🥈',
      message: `No detalhe! O bolão "${bolao.name}" terminou e você cravou um belíssimo segundo lugar. Faltou muito pouco!`
    };
  } else if (isThird) {
    config = {
      emoji: '🥉',
      title: 'No Pódio! 3º Lugar',
      titleColor: 'from-orange-400 to-orange-600',
      border: 'border-orange-500/50',
      gradient: 'from-orange-600/20',
      shadow: 'shadow-[0_0_50px_rgba(249,115,22,0.3)]',
      glow: 'rgba(249,115,22,0.15)',
      button: 'from-orange-500 to-orange-600 text-white',
      buttonShadow: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
      buttonText: 'Garantir Bronze 🥉',
      message: `Que desempenho! Você superou quase todo mundo e garantiu seu lugar no pódio do bolão "${bolao.name}".`
    };
  } else {
    config = {
      emoji: '😅',
      title: 'Não foi dessa vez...',
      titleColor: 'from-gray-400 to-gray-600',
      border: 'border-dark-700',
      gradient: 'from-dark-800',
      shadow: 'shadow-[0_0_50px_rgba(0,0,0,0.5)]',
      glow: 'transparent',
      button: 'bg-dark-700 text-white border border-dark-600 hover:bg-dark-600',
      buttonShadow: '',
      buttonText: 'Tentar na Próxima Copa ⚽',
      message: `O bolão "${bolao.name}" acabou e você terminou na ${userRankPosition + 1}ª posição. Na próxima vez, os deuses do futebol estarão do seu lado!`
    };
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/95 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className={`relative max-w-lg w-full bg-gradient-to-b ${config.gradient} to-dark-800 border-2 ${config.border} rounded-3xl p-8 text-center ${config.shadow} overflow-hidden`}
        >
          {/* Efeito de brilho giratório ao fundo (apenas para o pódio) */}
          {!isOther && (
            <div className="absolute inset-0 animate-pulse" style={{ background: `radial-gradient(circle at center, ${config.glow} 0%, transparent 70%)` }}></div>
          )}
          
          <div className="relative z-10">
            <motion.div 
              animate={!isOther ? { rotate: [0, 10, -10, 0] } : { y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`text-7xl md:text-9xl mb-4 ${!isOther ? `drop-shadow-[0_0_15px_${config.glow.replace(',0.15)', ',0.8)')}]` : ''}`}
            >
              {config.emoji}
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3 uppercase leading-tight">
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${config.titleColor}`}>
                {config.title}
              </span>
            </h2>
            
            <p className="text-gray-300 text-lg md:text-xl mb-8 leading-relaxed">
              {config.message}
            </p>

            <div className="flex justify-center items-center gap-4 mb-8">
              <div className="bg-dark-900/80 rounded-2xl p-4 border border-dark-700 min-w-[150px]">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Sua Pontuação</span>
                <span className="text-4xl font-black text-neon-green">{userScore}</span>
              </div>
              <div className="bg-dark-900/80 rounded-2xl p-4 border border-dark-700 min-w-[150px]">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Posição Final</span>
                <span className="text-4xl font-black text-white">{userRankPosition + 1}º</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className={`w-full bg-gradient-to-r ${config.button} font-black text-lg py-4 rounded-xl hover:scale-105 active:scale-95 transition-all ${config.buttonShadow}`}
            >
              {config.buttonText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
