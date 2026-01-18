'use client';

import { motion } from 'framer-motion';

const glitchMessages = [
  'The Glitch is thinking...',
  'Calculating chaos...',
  'Consulting the void...',
  'Scanning memories...',
  'Generating mischief...',
];

export function GlitchLoader() {
  const message = glitchMessages[0];

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <motion.div
        className="text-6xl font-bold glitch-text text-white mb-8"
        animate={{
          x: [0, -2, 2, -2, 0],
          textShadow: [
            '2px 0 #ff00ff, -2px 0 #00ffff',
            '-2px 0 #ff00ff, 2px 0 #00ffff',
            '2px 0 #00ffff, -2px 0 #ff00ff',
            '-2px 0 #00ffff, 2px 0 #ff00ff',
            '2px 0 #ff00ff, -2px 0 #00ffff',
          ],
        }}
        transition={{ duration: 0.2, repeat: Infinity }}
      >
        ⌁
      </motion.div>
      <motion.p
        className="text-gray-400 text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>
      <div className="mt-8 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-cyan-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
