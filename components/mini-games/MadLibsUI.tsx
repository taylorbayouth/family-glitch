'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { sendChatRequest } from '@/lib/ai/client';
import {
  buildMadLibsGeneratorPrompt,
  buildMadLibsScorerPrompt,
  parseMadLibsGeneratorResponse,
  parseMadLibsScoreResponse,
  toMiniGameResult,
  fillTemplate,
  createBlanksFromTemplate,
} from '@/lib/mini-games/madlibs-challenge';
import type { MadLibsBlank, MiniGameResult } from '@/lib/mini-games/types';

interface Player {
  id: string;
  name: string;
  role?: string;
}

interface MadLibsUIProps {
  /** Player answering the challenge */
  targetPlayer: Player;

  /** All players (for context) */
  allPlayers: Player[];

  /** Called when challenge completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;
}

type MadLibsPhase = 'loading' | 'intro' | 'filling' | 'scoring' | 'result';

/**
 * Mad Libs Challenge UI Component
 *
 * Flow:
 * 1. Loading - AI generates template
 * 2. Intro - Show the challenge
 * 3. Filling - Player types words for each blank
 * 4. Scoring - AI evaluates creativity
 * 5. Result - Show score with commentary
 */
export function MadLibsUI({
  targetPlayer,
  allPlayers,
  onComplete,
  onSkip,
}: MadLibsUIProps) {
  const [phase, setPhase] = useState<MadLibsPhase>('loading');
  const [template, setTemplate] = useState('');
  const [hint, setHint] = useState<string | undefined>();
  const [blanks, setBlanks] = useState<MadLibsBlank[]>([]);
  const [filledWords, setFilledWords] = useState<string[]>([]);
  const [result, setResult] = useState<MiniGameResult | null>(null);
  const [filledSentence, setFilledSentence] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<boolean[]>([]);

  const scores = useGameStore((state) => state.scores);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);

  // Generate template on mount
  useEffect(() => {
    generateTemplate();
  }, []);

  const generateTemplate = async () => {
    setPhase('loading');
    setError(null);

    try {
      const prompt = buildMadLibsGeneratorPrompt({
        targetPlayerName: targetPlayer.name,
        allPlayers,
        scores,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate a Mad Libs template now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseMadLibsGeneratorResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid template response from AI');
      }

      // Create blanks with assigned letters
      const newBlanks = createBlanksFromTemplate(parsed.template);

      setTemplate(parsed.template);
      setHint(parsed.hint);
      setBlanks(newBlanks);
      setFilledWords(new Array(newBlanks.length).fill(''));
      setValidationErrors(new Array(newBlanks.length).fill(false));
      setPhase('intro');
    } catch (err) {
      console.error('Failed to generate template:', err);
      // Fallback template
      const fallbackTemplate = "The best thing about ___ is that it makes me feel ___.";
      const fallbackBlanks = createBlanksFromTemplate(fallbackTemplate);
      setTemplate(fallbackTemplate);
      setBlanks(fallbackBlanks);
      setFilledWords(new Array(fallbackBlanks.length).fill(''));
      setValidationErrors(new Array(fallbackBlanks.length).fill(false));
      setPhase('intro');
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...filledWords];
    newWords[index] = value;
    setFilledWords(newWords);

    // Validate - word must start with the assigned letter
    const newErrors = [...validationErrors];
    const requiredLetter = blanks[index].letter.toUpperCase();
    const firstChar = value.trim().charAt(0).toUpperCase();
    newErrors[index] = value.trim().length > 0 && firstChar !== requiredLetter;
    setValidationErrors(newErrors);
  };

  const isValid = (index: number): boolean => {
    const word = filledWords[index]?.trim();
    if (!word) return false;
    const requiredLetter = blanks[index].letter.toUpperCase();
    return word.charAt(0).toUpperCase() === requiredLetter;
  };

  const allFieldsValid = (): boolean => {
    return blanks.every((_, i) => isValid(i));
  };

  const handleSubmit = async () => {
    if (!allFieldsValid()) return;

    setPhase('scoring');
    setError(null);

    try {
      const filled = fillTemplate(template, filledWords);
      setFilledSentence(filled);

      const prompt = buildMadLibsScorerPrompt({
        targetPlayerName: targetPlayer.name,
        sentenceTemplate: template,
        blanks,
        filledWords,
        filledSentence: filled,
        allPlayers,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Score this Mad Libs response now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseMadLibsScoreResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid score response from AI');
      }

      // Update score
      updatePlayerScore(targetPlayer.id, parsed.score);

      const gameResult = toMiniGameResult(parsed);
      setResult(gameResult);
      setFilledSentence(parsed.filledSentence || filled);
      setPhase('result');
    } catch (err) {
      console.error('Failed to score Mad Libs:', err);
      // Fallback scoring
      const filled = fillTemplate(template, filledWords);
      const fallbackResult: MiniGameResult = {
        score: 2,
        maxScore: 5,
        commentary: 'Technical difficulties! Points for creativity.',
      };
      updatePlayerScore(targetPlayer.id, 2);
      setResult(fallbackResult);
      setFilledSentence(filled);
      setPhase('result');
    }
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result);
    }
  };

  // Score color based on value (amber/gold theme)
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-amber-400';
    if (score >= 2) return 'text-amber-500';
    return 'text-alert';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-amber-400/20 border-amber-400/50';
    if (score >= 2) return 'bg-amber-500/20 border-amber-500/50';
    return 'bg-alert/20 border-alert/50';
  };

  // Render template with blanks highlighted
  const renderTemplatePreview = () => {
    const parts = template.split('___');
    return (
      <span>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < blanks.length && (
              <span className={`inline-block min-w-[60px] mx-1 px-2 py-0.5 rounded border-b-2 ${
                filledWords[i] && isValid(i)
                  ? 'bg-amber-400/20 border-amber-400 text-amber-400'
                  : 'bg-steel-800 border-steel-600 text-steel-400'
              }`}>
                {filledWords[i] || `[${blanks[i].letter}...]`}
              </span>
            )}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="bg-void flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-steel-800 bg-void/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-amber-400 uppercase tracking-wider">
              Mad Libs Challenge
            </p>
            <h2 className="text-xl font-bold text-frost">{targetPlayer.name}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-steel-500">Fill the blanks!</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Loading Phase */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-amber-400 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Wordsmith is crafting...</p>
            </motion.div>
          )}

          {/* Intro Phase - Dramatic Full Screen */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-amber-400/20 via-void to-amber-500/10 flex flex-col items-center justify-center p-6 z-50 overflow-hidden"
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-1/3 left-1/4 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-amber-500/30 rounded-full blur-3xl"
                  animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative z-10 text-center space-y-6 max-w-lg"
              >
                {/* Mini-game badge */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-2 rounded-full bg-amber-400/30 border border-amber-400"
                >
                  <span className="font-mono text-sm text-amber-400 uppercase tracking-widest">
                    Mini-Game
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-black text-frost"
                >
                  Mad Libs Challenge
                </motion.h1>

                {/* Description */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="glass rounded-xl p-6 border border-amber-400/30 space-y-3"
                >
                  <p className="text-steel-300 text-lg">
                    Fill in the blanks with words starting with specific letters!
                  </p>
                  <p className="text-amber-400 text-sm font-medium">
                    Be creative - you're scored on humor!
                  </p>
                  {hint && (
                    <p className="text-steel-500 text-sm italic">Theme: {hint}</p>
                  )}
                </motion.div>

                {/* Show letters */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex justify-center gap-3"
                >
                  {blanks.map((blank, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.6 + i * 0.1 }}
                      className="w-14 h-14 rounded-xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                    >
                      <span className="text-2xl font-black text-amber-400">{blank.letter}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Place phone reminder */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="flex items-center justify-center gap-2 text-steel-500"
                >
                  <span className="text-lg">📱</span>
                  <p className="text-sm">Place phone on table so everyone can see!</p>
                </motion.div>

                {/* Start button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setPhase('filling')}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-void font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                >
                  Let's Go!
                </motion.button>

                {onSkip && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    onClick={onSkip}
                    className="text-steel-500 hover:text-frost text-sm py-2"
                  >
                    Skip this challenge
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Filling Phase */}
          {phase === 'filling' && (
            <motion.div
              key="filling"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              {/* Live Preview */}
              <div className="glass rounded-xl p-4 border border-steel-800">
                <p className="font-mono text-xs text-steel-500 uppercase mb-2">Preview</p>
                <p className="text-frost text-lg leading-relaxed">
                  {renderTemplatePreview()}
                </p>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                {blanks.map((blank, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-black text-amber-400">{blank.letter}</span>
                      </div>
                      <input
                        type="text"
                        value={filledWords[index]}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        placeholder={`Word starting with ${blank.letter}...`}
                        className={`flex-1 px-4 py-3 rounded-xl bg-void-light border-2 text-frost placeholder-steel-600 focus:outline-none transition-colors ${
                          validationErrors[index]
                            ? 'border-alert focus:border-alert'
                            : isValid(index)
                            ? 'border-amber-400 focus:border-amber-300'
                            : 'border-steel-800 focus:border-amber-400'
                        }`}
                        autoFocus={index === 0}
                      />
                      {isValid(index) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center"
                        >
                          <svg
                            className="w-5 h-5 text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    {validationErrors[index] && (
                      <p className="text-alert text-xs ml-12">
                        Must start with "{blank.letter}"
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: allFieldsValid() ? 1 : 0.5 }}
                onClick={handleSubmit}
                disabled={!allFieldsValid()}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-steel-800 disabled:cursor-not-allowed text-void font-bold py-4 px-6 rounded-xl transition-all"
              >
                {allFieldsValid() ? 'Submit My Words!' : 'Fill in all blanks'}
              </motion.button>
            </motion.div>
          )}

          {/* Scoring Phase */}
          {phase === 'scoring' && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-amber-400 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Wordsmith is judging...</p>
            </motion.div>
          )}

          {/* Result Phase */}
          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg space-y-6"
            >
              {/* Score Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`rounded-xl p-8 border-2 ${getScoreBg(result.score)} text-center`}
              >
                <p className="font-mono text-xs text-steel-500 uppercase mb-2">Score</p>
                <p className={`text-6xl font-black ${getScoreColor(result.score)}`}>
                  {result.score}/{result.maxScore}
                </p>
              </motion.div>

              {/* Filled Sentence */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-6 border border-amber-400/30"
              >
                <p className="font-mono text-xs text-amber-400 uppercase mb-2">Your creation</p>
                <p className="text-frost text-xl leading-relaxed">"{filledSentence}"</p>
              </motion.div>

              {/* Commentary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-6 border border-steel-800"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✍️</span>
                  <p className="text-frost text-lg">{result.commentary}</p>
                </div>
              </motion.div>

              {/* Best/Worst Word */}
              {(result.correctAnswer || result.bonusInfo) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass rounded-xl p-4 border border-steel-800"
                >
                  {result.correctAnswer && (
                    <p className="text-frost text-sm">{result.correctAnswer}</p>
                  )}
                  {result.bonusInfo && (
                    <p className="text-steel-400 text-sm mt-1">{result.bonusInfo}</p>
                  )}
                </motion.div>
              )}

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleComplete}
                className="w-full bg-amber-400 hover:bg-amber-300 text-void font-bold py-4 px-6 rounded-xl transition-all"
              >
                Continue
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <div className="fixed bottom-6 left-6 right-6 glass rounded-xl p-4 border border-alert">
            <p className="text-alert text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
