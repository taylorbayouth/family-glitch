'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';

/**
 * Hamburger Menu Component
 *
 * Global navigation menu that appears as a hamburger icon in the top-right corner
 * for authenticated users only. Provides access to:
 * - How to Play instructions
 * - Start a New Game (resets game progress, keeps players)
 * - Log Out
 *
 * Uses Framer Motion for smooth animations and follows the Digital Noir design system.
 */
export function HamburgerMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);
  const startNewGame = useGameStore((state) => state.startNewGame);

  // Only show for logged-in users
  if (!session) return null;

  const handleNewGame = () => {
    startNewGame();
    setShowConfirmNewGame(false);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirectTo: '/' });
  };

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full glass border border-steel-800/50 flex items-center justify-center"
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <motion.div
            className="h-0.5 w-full bg-frost"
            animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="h-0.5 w-full bg-frost"
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="h-0.5 w-full bg-frost"
            animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </motion.button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-void/80 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-void-light border-l border-steel-800 z-40 p-8 flex flex-col"
            >
              {/* User Info */}
              <div className="mb-8 pb-6 border-b border-steel-800">
                <p className="font-mono text-xs text-steel-500 uppercase tracking-wider mb-2">
                  Logged in as
                </p>
                <p className="text-frost font-medium">{session.user?.name}</p>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 space-y-2">
                <MenuButton
                  onClick={() => {
                    setShowHowToPlay(true);
                    setIsOpen(false);
                  }}
                >
                  How to Play
                </MenuButton>

                <MenuButton
                  onClick={() => setShowConfirmNewGame(true)}
                  className="text-glitch-bright"
                >
                  Start a New Game
                </MenuButton>

                <MenuButton onClick={handleLogout} className="text-alert">
                  Log Out
                </MenuButton>
              </nav>

              {/* Version */}
              <div className="mt-auto pt-6 border-t border-steel-800">
                <p className="font-mono text-xs text-steel-600 text-center">
                  v1.0.0-stable
                </p>
                <p className="font-mono text-xs text-steel-700 text-center mt-1">
                  DIGITAL NOIR
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* How to Play Modal */}
      <AnimatePresence>
        {showHowToPlay && (
          <Modal onClose={() => setShowHowToPlay(false)} title="How to Play">
            <div className="space-y-4 text-frost/90">
              <p>
                <strong className="text-glitch-bright">Family Glitch</strong> is
                a 15-minute party game where a snarky AI host analyzes your group
                dynamics in real-time.
              </p>
              <div className="space-y-2">
                <h3 className="font-bold text-frost">Setup:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Add all players to the game</li>
                  <li>Pass the phone around the table</li>
                  <li>Each player takes their turn</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-frost">Gameplay:</h3>
                <p className="text-sm">
                  The AI will prompt questions and challenges. Answer honestly
                  (or not) and watch as The Glitch analyzes your group's
                  responses with wit and skepticism.
                </p>
              </div>
              <p className="text-sm text-steel-400 italic">
                Think Cards Against Humanity meets Black Mirror.
              </p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirm New Game Modal */}
      <AnimatePresence>
        {showConfirmNewGame && (
          <Modal
            onClose={() => setShowConfirmNewGame(false)}
            title="Start a New Game?"
          >
            <div className="space-y-6">
              <p className="text-frost/90">
                This will reset all game progress but keep your player list.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleNewGame}
                  className="flex-1 px-4 py-3 rounded-control bg-alert/20 border border-alert text-alert font-medium hover:bg-alert/30 transition-colors"
                >
                  Start New Game
                </button>
                <button
                  onClick={() => setShowConfirmNewGame(false)}
                  className="flex-1 px-4 py-3 rounded-control glass border border-steel-800 text-frost hover:border-steel-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Menu Button Component
 *
 * Reusable button component for menu items with consistent styling and animations.
 */
function MenuButton({
  onClick,
  children,
  className = '',
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-control glass border border-steel-800/50 hover:border-steel-700 transition-colors ${className}`}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

/**
 * Modal Component
 *
 * Reusable modal component for displaying overlay content (How to Play, confirmations, etc.)
 * with backdrop blur and smooth animations.
 */
function Modal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-void/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      >
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md glass rounded-card p-6 border border-steel-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-frost">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-steel-800/50 flex items-center justify-center transition-colors"
            >
              <span className="text-steel-500 text-xl">&times;</span>
            </button>
          </div>

          {/* Content */}
          {children}
        </motion.div>
      </motion.div>
    </>
  );
}
