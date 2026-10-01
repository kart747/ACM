'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import type { ArtworkData } from './types';

const analysisSchema = z.object({
  status: z.enum(['complete', 'curated_fallback']),
  model: z.string(),
  timestamp: z.string(),
  inputMode: z.literal('text_only'),
  assessmentRuns: z.number().int().min(0).max(1),
  attemptedCalls: z.number().int().min(0).max(1),
  fallbackReason: z.string().optional(),
  aiInsights: z.object({
    traditionContext: z.string().optional(),
    motifSymbolism: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
  }).optional(),
}).passthrough();

type AnalysisResult = z.infer<typeof analysisSchema>;

interface GeminiInspectorModalProps {
  artworks: ArtworkData[];
  isOpen: boolean;
  onClose: () => void;
}

function fallbackMessage(reason?: string): string {
  switch (reason) {
    case 'not_configured': return 'Gemini is not configured. No model call was made. Showing catalog data only.';
    case 'record_not_found': return 'The selected catalog record was not found. No model call was made.';
    case 'invalid_response': return 'Gemini returned an invalid response. Showing catalog data only, not an AI assessment.';
    case 'request_failed': return 'The Gemini request failed. Showing catalog data only, not an AI assessment.';
    default: return 'No usable AI assessment is available. Showing catalog data only.';
  }
}

export function GeminiInspectorModal({ artworks, isOpen, onClose }: GeminiInspectorModalProps) {
  const [selectedId, setSelectedId] = useState(artworks[0]?.id || '');
  const activeId = artworks.some(artwork => artwork.id === selectedId) ? selectedId : artworks[0]?.id || '';
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; data: AnalysisResult } | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    request.current?.abort();
    setPendingId(null);
    setResult(null);
    setError(null);
    return () => { request.current?.abort(); };
  }, [activeId, isOpen]);

  if (!isOpen) return null;

  const loading = pendingId === activeId;
  const analysisResult = result?.id === activeId ? result.data : null;
  const currentError = error?.id === activeId ? error.message : null;
  const handleClose = () => {
    request.current?.abort();
    onClose();
  };

  const handleRunAnalysis = async () => {
    if (!activeId) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPendingId(activeId);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: activeId }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Assessment request failed (${res.status}).`);
      const data = analysisSchema.parse(await res.json());
      if (data.status === 'complete' && (!data.aiInsights || data.assessmentRuns !== 1 || (!data.aiInsights.traditionContext && !data.aiInsights.motifSymbolism))) {
        throw new Error('The assessment response was incomplete.');
      }
      if (!controller.signal.aborted) setResult({ id: activeId, data });
    } catch (err) {
      if (!controller.signal.aborted) {
        setError({ id: activeId, message: err instanceof z.ZodError ? 'The assessment response was invalid.' : err instanceof Error ? err.message : 'Assessment request failed.' });
      }
    } finally {
      if (!controller.signal.aborted) setPendingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gemini-inspector-title"
          className="relative max-w-4xl w-full bg-stone-950 border border-amber-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[calc(100dvh-2rem)] overflow-y-auto my-auto"
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-sans font-bold">
                Gemini Inspector
              </span>
              <h3 id="gemini-inspector-title" className="text-2xl font-serif text-white">
                Single Text-Only Assessment
              </h3>
              <p className="text-sm text-stone-300 mt-2 leading-relaxed">
                Sends catalog text to one Gemini model. No artwork image is sent. The response is not visual inspection, historical verification, or consensus.
              </p>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close Gemini inspector"
              className="w-8 h-8 shrink-0 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div className="flex-1 min-w-0 w-full">
              <label htmlFor="gemini-artwork" className="block text-xs uppercase font-sans tracking-wider text-stone-300 mb-1">
                Select Artwork for Text Assessment
              </label>
              <select
                id="gemini-artwork"
                value={activeId}
                onChange={(event) => {
                  request.current?.abort();
                  setSelectedId(event.target.value);
                  setResult(null);
                  setError(null);
                  setPendingId(null);
                }}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {artworks.map(artwork => (
                  <option key={artwork.id} value={artwork.id} className="bg-stone-950">
                    {artwork.title} ({artwork.creator}, {artwork.year})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={loading || !activeId}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-sans font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all shrink-0 mt-auto disabled:opacity-50"
            >
              {loading ? 'Assessing…' : 'Run Gemini Analysis →'}
            </button>
          </div>

          <div className="min-h-32 shrink-0 bg-black/80 rounded-2xl p-4 sm:p-5 border border-white/10 font-mono text-xs text-stone-300 space-y-4">
            {loading ? (
              <p role="status" className="py-10 text-amber-300 font-sans text-center">
                Waiting for one text-only response from Gemini…
              </p>
            ) : currentError ? (
              <p role="alert" className="text-red-300 font-sans text-sm">
                {currentError} No assessment is available. You can retry.
              </p>
            ) : analysisResult ? (
              <div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-300 border-b border-white/10 pb-2 mb-3 font-sans">
                  <span>Status: <strong>{analysisResult.status === 'complete' ? 'Single text-only response' : 'Catalog fallback'}</strong></span>
                  <span>{analysisResult.status === 'complete' ? 'Model' : 'Configured model'}: <strong>{analysisResult.model}</strong></span>
                  <span>Usable assessments: <strong>{analysisResult.assessmentRuns}</strong></span>
                  <span>API calls attempted: <strong>{analysisResult.attemptedCalls}</strong></span>
                  <span>Time: <strong>{analysisResult.timestamp}</strong></span>
                </div>
                {analysisResult.status === 'curated_fallback' && (
                  <p role="status" className="p-3 mb-4 rounded-xl bg-amber-500/10 text-amber-200 font-sans text-sm">
                    {fallbackMessage(analysisResult.fallbackReason)} Catalog data is not a verified Gemini result.
                  </p>
                )}
                {analysisResult.status === 'complete' && analysisResult.aiInsights && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 mb-4 font-sans text-sm leading-relaxed">
                    <p className="font-bold mb-2">Model-generated interpretation of supplied text</p>
                    {analysisResult.aiInsights.traditionContext && <p className="mb-2"><strong>Context:</strong> {analysisResult.aiInsights.traditionContext}</p>}
                    {analysisResult.aiInsights.motifSymbolism && <p className="mb-2"><strong>Motif interpretation:</strong> {analysisResult.aiInsights.motifSymbolism}</p>}
                    {typeof analysisResult.aiInsights.confidence === 'number' && (
                      <p className="text-xs">Model self-reported confidence: {(analysisResult.aiInsights.confidence * 100).toFixed(0)}% (not independently calibrated or verified).</p>
                    )}
                  </div>
                )}
                <pre className="whitespace-pre-wrap break-words overflow-x-auto text-stone-300">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-10 text-stone-300 font-sans text-sm">
                <p>Run Gemini Analysis to request one assessment of the supplied catalog text.</p>
                <p className="text-xs mt-2">Without a usable model response, the API returns catalog data only. AI interpretations can be wrong.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end">
            <button onClick={handleClose} className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-sans text-white transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
