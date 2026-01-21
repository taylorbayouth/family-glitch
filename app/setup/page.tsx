'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore, useHydration, type PlayerRole } from '@/lib/store';
import { useRouter } from 'next/navigation';

// Avatar image paths (1.png through 14.png in public/avatars/)
const AVATAR_COUNT = 14;
const getAvatarPath = (index: number) => `/avatars/${index}.png`;

const ROLES: PlayerRole[] = [
  'Dad', 'Mom', 'Son', 'Daughter', 'Brother', 'Sister',
  'Grandpa', 'Grandma', 'Uncle', 'Aunt', 'Cousin', 'Friend', 'Other',
];

interface PlayerFormData {
  id: string;
  name: string;
  role: PlayerRole;
  age: string;
  avatar: number;
  isExpanded: boolean;
}

export default function SetupPage() {
  const hasHydrated = useHydration();
  const { players, addPlayer, updatePlayer, removePlayer } = usePlayerStore();
  const router = useRouter();

  const [playerForms, setPlayerForms] = useState<PlayerFormData[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form state with store after hydration
  useEffect(() => {
    if (hasHydrated && !hasInitialized) {
      if (players.length > 0) {
        setPlayerForms(players.map((p, i) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          age: p.age.toString(),
          avatar: p.avatar,
          isExpanded: i === 0,
        })));
      } else {
        setPlayerForms(Array.from({ length: 3 }, (_, i) => ({
          id: crypto.randomUUID(),
          name: '',
          role: 'Friend' as PlayerRole,
          age: '',
          avatar: Math.floor(Math.random() * AVATAR_COUNT) + 1,
          isExpanded: i === 0,
        })));
      }
      setHasInitialized(true);
    }
  }, [hasHydrated, hasInitialized, players]);

  if (!hasHydrated || !hasInitialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-void">
        <div className="text-frost font-mono text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  const toggleExpanded = (id: string) => {
    setPlayerForms(forms =>
      forms.map(f => ({ ...f, isExpanded: f.id === id ? !f.isExpanded : false }))
    );
  };

  const handleAddPlayer = () => {
    if (playerForms.length < 7) {
      const newId = crypto.randomUUID();
      setPlayerForms([
        ...playerForms.map(f => ({ ...f, isExpanded: false })),
        {
          id: newId,
          name: '',
          role: 'Friend',
          age: '',
          avatar: Math.floor(Math.random() * AVATAR_COUNT) + 1,
          isExpanded: true,
        },
      ]);
    }
  };

  const handleRemovePlayer = (id: string) => {
    if (playerForms.length > 3) {
      setPlayerForms(playerForms.filter((p) => p.id !== id));
      removePlayer(id);
    }
  };

  const handleUpdateForm = (id: string, field: keyof PlayerFormData, value: string | number | boolean) => {
    setPlayerForms(playerForms.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-${field}`];
      return newErrors;
    });
  };

  const validateAndSave = () => {
    const newErrors: Record<string, string> = {};

    playerForms.forEach((form) => {
      if (!form.name.trim()) {
        newErrors[`${form.id}-name`] = 'Required';
      }
      if (!form.age || parseInt(form.age) < 1 || parseInt(form.age) > 120) {
        newErrors[`${form.id}-age`] = 'Required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Expand the first player with an error
      const firstErrorId = Object.keys(newErrors)[0].split('-')[0];
      setPlayerForms(forms =>
        forms.map(f => ({ ...f, isExpanded: f.id === firstErrorId }))
      );
      return;
    }

    playerForms.forEach((form) => {
      const existingPlayer = players.find((p) => p.id === form.id);
      if (existingPlayer) {
        updatePlayer(form.id, {
          name: form.name.trim(),
          role: form.role,
          age: parseInt(form.age),
          avatar: form.avatar,
        });
      } else {
        addPlayer({
          name: form.name.trim(),
          role: form.role,
          age: parseInt(form.age),
          avatar: form.avatar,
        });
      }
    });

    players.forEach((player) => {
      if (!playerForms.find((f) => f.id === player.id)) {
        removePlayer(player.id);
      }
    });

    router.push('/play');
  };

  const getPlayerSummary = (form: PlayerFormData) => {
    if (form.name) {
      return `${form.name}${form.role !== 'Friend' ? ` (${form.role})` : ''}`;
    }
    return 'Tap to edit';
  };

  return (
    <div className="min-h-dvh bg-void relative">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-glitch/15 rounded-full blur-[120px]" />

      <div className="relative z-10 min-h-dvh h-dvh flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pt-8 pb-6"
        >
          <h1 className="text-3xl font-black text-frost mb-1">Player Setup</h1>
          <p className="text-steel-500 text-sm font-mono">
            Add 3-7 players to begin
          </p>
        </motion.header>

        {/* Player List */}
        <div className="flex-1 min-h-0 px-4 pb-4 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {playerForms.map((form, index) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                layout
                className="mb-3"
              >
                <AnimatePresence mode="wait">
                  {/* Collapsed view */}
                  {!form.isExpanded ? (
                    <motion.button
                      key="collapsed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    onClick={() => toggleExpanded(form.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full glass rounded-xl p-4 flex items-center gap-4 text-left hover:border-glitch/50 transition-all hover:shadow-glow group"
                  >
                    <motion.div
                      className="w-14 h-14 rounded-full bg-void-light border-2 border-steel-700 overflow-hidden flex-shrink-0 group-hover:border-glitch/50 transition-colors"
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={getAvatarPath(form.avatar)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-glitch-bright">
                          #{index + 1}
                        </span>
                        {(errors[`${form.id}-name`] || errors[`${form.id}-age`]) && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs text-alert"
                          >
                            Incomplete
                          </motion.span>
                        )}
                      </div>
                      <p className="text-frost font-medium truncate mb-0.5">
                        {getPlayerSummary(form)}
                      </p>
                      {form.age && (
                        <p className="text-steel-500 text-xs font-mono">
                          Age {form.age}
                        </p>
                      )}
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-steel-600 group-hover:text-glitch transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ y: [0, 2, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                    </motion.button>
                  ) : (
                    /* Expanded view */
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="glass rounded-xl p-5 border-glitch/30 overflow-hidden"
                    >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-glitch/20 border border-glitch flex items-center justify-center">
                          <span className="font-mono text-sm text-glitch-bright font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-steel-500 uppercase tracking-wider">
                          Player {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {playerForms.length > 3 && (
                          <button
                            onClick={() => handleRemovePlayer(form.id)}
                            className="p-2 text-steel-600 hover:text-alert transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpanded(form.id)}
                          className="p-2 text-steel-600 hover:text-frost transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Avatar Selection */}
                    <div className="mb-5">
                      <label className="block text-xs text-steel-500 uppercase tracking-wider mb-3 font-mono">
                        Avatar
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
                        {Array.from({ length: AVATAR_COUNT }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => handleUpdateForm(form.id, 'avatar', i + 1)}
                            className={`aspect-square rounded-full overflow-hidden transition-all ${
                              form.avatar === i + 1
                                ? 'ring-3 ring-glitch ring-offset-2 ring-offset-void scale-105 shadow-glow'
                                : 'border-2 border-steel-700 hover:border-steel-500 hover:scale-105'
                            }`}
                          >
                            <img
                              src={getAvatarPath(i + 1)}
                              alt={`Avatar ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name & Role */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-steel-500 uppercase tracking-wider mb-2 font-mono">
                          Name
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => handleUpdateForm(form.id, 'name', e.target.value)}
                          placeholder="Enter name"
                          className={`w-full px-4 py-3 rounded-lg bg-void-light border text-frost placeholder:text-steel-600 focus:outline-none focus:border-glitch transition-colors ${
                            errors[`${form.id}-name`] ? 'border-alert' : 'border-steel-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-steel-500 uppercase tracking-wider mb-2 font-mono">
                          Role
                        </label>
                        <select
                          value={form.role}
                          onChange={(e) => handleUpdateForm(form.id, 'role', e.target.value as PlayerRole)}
                          className="w-full px-4 py-3 rounded-lg bg-void-light border border-steel-800 text-frost focus:outline-none focus:border-glitch transition-colors appearance-none cursor-pointer"
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-xs text-steel-500 uppercase tracking-wider mb-2 font-mono">
                        Age
                      </label>
                      <input
                        type="number"
                        value={form.age}
                        onChange={(e) => handleUpdateForm(form.id, 'age', e.target.value)}
                        placeholder="Enter age"
                        min="1"
                        max="120"
                        className={`w-full px-4 py-3 rounded-lg bg-void-light border text-frost placeholder:text-steel-600 focus:outline-none focus:border-glitch transition-colors ${
                          errors[`${form.id}-age`] ? 'border-alert' : 'border-steel-800'
                        }`}
                      />
                    </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Player Button */}
          {playerForms.length < 7 && (
            <motion.button
              onClick={handleAddPlayer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full py-4 rounded-xl border-2 border-dashed border-steel-700 text-steel-500 hover:border-glitch hover:text-glitch transition-colors flex items-center justify-center gap-2 font-mono text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Player
            </motion.button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-void via-void to-transparent">
          <button
            onClick={validateAndSave}
            className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-strong active:scale-[0.98]"
          >
            Continue
          </button>
          <p className="text-center mt-3 text-xs text-steel-600 font-mono">
            {playerForms.length} of 7 players
          </p>
        </div>
      </div>
    </div>
  );
}
