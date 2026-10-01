'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArtworkData } from './types';

interface GeminiInspectorModalProps {
  artworks: ArtworkData[];
  isOpen: boolean;
  onClose: () => void;
}

export function GeminiInspectorModal({ artworks, isOpen, onClose }: GeminiInspectorModalProps) {
  const [selectedId, setSelectedId] = useState<string>(artworks[0]?.id || 'art_001');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: selectedId }),
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const selectedArtwork = artworks.find(a => a.id === selectedId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-4xl w-full bg-stone-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-sans font-bold">
                Live Intelligence Console
              </span>
              <h3 className="text-2xl font-serif text-white flex items-center gap-2">
                <span>Gemini Multimodal Reasoning</span>
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  gemini-2.5-flash
                </span>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Selector & Action */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div className="flex-1 w-full">
              <label className="block text-xs uppercase font-sans tracking-wider text-stone-400 mb-1">
                Select Artwork for Multimodal Evaluation
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {artworks.map((a) => (
                  <option key={a.id} value={a.id} className="bg-stone-950">
                    {a.title} ({a.creator}, {a.year})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-sans font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all shrink-0 mt-auto"
            >
              {loading ? 'Evaluating...' : 'Run Gemini Analysis →'}
            </button>
          </div>

          {/* Results Display */}
          <div className="flex-1 overflow-y-auto max-h-[45vh] bg-black/80 rounded-2xl p-5 border border-white/10 font-mono text-xs text-stone-300 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-amber-300 font-sans">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span>Streaming multimodal reasoning from Gemini API...</span>
              </div>
            ) : analysisResult ? (
              <div>
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-white/10 pb-2 mb-3 font-sans">
                  <span>Status: <strong>{analysisResult.status}</strong></span>
                  <span>Model: <strong>{analysisResult.model}</strong></span>
                  <span>Time: <strong>{analysisResult.timestamp}</strong></span>
                </div>
                {analysisResult.aiInsights && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 mb-4 font-sans text-xs">
                    <p className="font-bold mb-1">✨ Multimodal Semantic Insight:</p>
                    <p className="mb-2"><strong>Context:</strong> {analysisResult.aiInsights.traditionContext}</p>
                    <p className="mb-1"><strong>Motif Symbolism:</strong> {analysisResult.aiInsights.motifSymbolism}</p>
                    <p className="text-[10px] text-amber-300/80">Confidence: {(analysisResult.aiInsights.confidence * 100).toFixed(0)}%</p>
                  </div>
                )}
                <pre className="whitespace-pre-wrap overflow-x-auto text-emerald-400">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-10 text-stone-500 font-sans">
                <p>Click "Run Gemini Analysis" to inspect real-time semantic extraction and CreativeDNA validation.</p>
                <p className="text-xs text-stone-600 mt-2">Prompts A, B, C, D, and Hedging Linter ensure strict provenance without hallucinations.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-sans text-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
