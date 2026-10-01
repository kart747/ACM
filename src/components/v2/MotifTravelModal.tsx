'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import type { RelationshipData, ArtworkData, ElementData } from './types';
import { CulturalEvidence } from './CulturalEvidence';
import { ImageCredit } from './ImageCredit';
import { SourceRecord } from './SourceRecord';

const assessmentSchema = z.object({
  assessmentStatus: z.enum(['complete', 'curated_fallback']),
  model: z.string(),
  verificationRuns: z.number().int().min(0).max(1),
  fallbackReason: z.string().optional(),
  assessment: z.object({
    supported: z.boolean(),
    explanation: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
  }).optional(),
});

interface MotifTravelModalProps {
  relationship: RelationshipData | null;
  sourceArtwork: ArtworkData | null;
  targetArtwork: ArtworkData | null;
  sourceElement: ElementData | null;
  targetElement: ElementData | null;
  onClose: () => void;
  onArriveAtTarget: () => void;
}

export function MotifTravelModal({
  relationship,
  sourceArtwork,
  targetArtwork,
  sourceElement,
  targetElement,
  onClose,
  onArriveAtTarget,
}: MotifTravelModalProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<{ id: string; text: string; error?: boolean } | null>(null);
  const request = useRef<AbortController | null>(null);
  const selectedId = relationship?.id;

  useEffect(() => {
    request.current?.abort();
    setPendingId(null);
    setAssessmentResult(null);
    return () => { request.current?.abort(); };
  }, [selectedId]);

  if (!relationship || !sourceArtwork || !targetArtwork) return null;

  const isVerifying = pendingId === relationship.id;
  const currentResult = assessmentResult?.id === relationship.id ? assessmentResult : null;
  const handleClose = () => {
    request.current?.abort();
    onClose();
  };
  const handleVerify = async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setPendingId(relationship.id);
    setAssessmentResult(null);
    try {
      const res = await fetch('/api/relationships/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId: relationship.id }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Assessment request failed (${res.status}).`);
      const data = assessmentSchema.parse(await res.json());
      if (controller.signal.aborted) return;
      if (data.assessmentStatus === 'complete' && data.assessment && data.verificationRuns === 1) {
        setAssessmentResult({
          id: relationship.id,
          text: `Single text-only assessment (${data.model}): ${data.assessment.supported ? 'The model finds the supplied comparison plausible.' : 'The model does not find the supplied comparison supported.'} ${data.assessment.explanation} This is not historical verification.`,
        });
      } else if (data.assessmentStatus === 'curated_fallback') {
        setAssessmentResult({
          id: relationship.id,
          text: data.fallbackReason === 'not_configured'
            ? 'Gemini is not configured. No model call was made; the catalog comparison remains unverified.'
            : 'Gemini returned no usable assessment. The catalog comparison remains unverified.',
        });
      } else {
        throw new Error('The assessment response was incomplete.');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setAssessmentResult({ id: relationship.id, error: true, text: error instanceof z.ZodError ? 'The assessment response was invalid. No verification was performed.' : `${error instanceof Error ? error.message : 'Assessment request failed.'} No verification was performed.` });
      }
    } finally {
      if (!controller.signal.aborted) setPendingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="motif-comparison-title"
          className="relative max-w-4xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-stone-950 border border-amber-500/30 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-amber-500/10 flex flex-col gap-6 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-sans font-bold">
                  The Motif Travels
                </span>
                <h3 id="motif-comparison-title" className="text-xl sm:text-2xl font-serif text-white">
                  Visual Comparison
                </h3>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close visual comparison"
              className="w-8 h-8 shrink-0 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Side by Side Visual Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Bidirectional resonance badge */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-amber-400 text-black font-bold text-xl items-center justify-center shadow-lg shadow-amber-500/50" title="Side-by-side visual comparison">
              ⇄
            </div>

            {/* Source Card */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-3">
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-900 border border-white/5">
                <img
                  src={sourceArtwork.image.startsWith('/') ? sourceArtwork.image : `/${sourceArtwork.image}`}
                  alt={sourceArtwork.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] text-amber-300 font-sans border border-amber-500/30">
                  Tradition A • {sourceArtwork.year}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-400 font-sans font-semibold">
                  {sourceArtwork.tradition}
                </div>
                <h4 className="font-serif text-lg text-white">
                  {sourceArtwork.title}
                </h4>
                <p className="text-xs text-stone-400 font-sans">
                  {sourceArtwork.creator} ({sourceArtwork.region})
                </p>
                {sourceElement && (
                  <div className="mt-2 text-xs text-amber-200/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                    Motif: <strong>{sourceElement.label}</strong>
                  </div>
                )}
              </div>
              <SourceRecord artwork={sourceArtwork} />
              <ImageCredit credit={sourceArtwork.imageCredit} photograph={sourceArtwork.sourceKind === 'photograph'} />
              <CulturalEvidence key={sourceArtwork.id} claims={sourceArtwork.culturalClaims} title="Source artwork: cultural context & evidence" />
            </div>

            {/* Target Card */}
            <div className="p-4 rounded-2xl bg-black/50 border border-amber-500/30 flex flex-col gap-3 shadow-lg shadow-amber-500/5">
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-stone-900 border border-white/5">
                <img
                  src={targetArtwork.image.startsWith('/') ? targetArtwork.image : `/${targetArtwork.image}`}
                  alt={targetArtwork.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-bold text-[10px] font-sans">
                  Tradition B • {targetArtwork.year}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-400 font-sans font-semibold">
                  {targetArtwork.tradition}
                </div>
                <h4 className="font-serif text-lg text-white">
                  {targetArtwork.title}
                </h4>
                <p className="text-xs text-stone-400 font-sans">
                  {targetArtwork.creator} ({targetArtwork.region})
                </p>
                {targetElement && (
                  <div className="mt-2 text-xs text-amber-200/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                    Motif: <strong>{targetElement.label}</strong>
                  </div>
                )}
              </div>
              <SourceRecord artwork={targetArtwork} />
              <ImageCredit credit={targetArtwork.imageCredit} photograph={targetArtwork.sourceKind === 'photograph'} />
              <CulturalEvidence key={targetArtwork.id} claims={targetArtwork.culturalClaims} title="Target artwork: cultural context & evidence" />
            </div>
          </div>

          {/* Comparison notes */}
          <div className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col gap-4">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-amber-400 font-sans font-bold mb-2">
                Comparison Notes
              </h4>
              <p className="text-base text-stone-200 font-serif leading-relaxed italic">
                "{relationship.narrative}"
              </p>
            </div>

            {/* Epistemic clarification box */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs font-sans text-stone-300 leading-relaxed">
              <p className="text-amber-300 font-semibold mb-1">
                Visual comparison · not historical verification
              </p>
              <p className="text-stone-300">
                These notes compare selected motifs. Similarity alone does not establish shared origins, historical contact, influence, or transmission between these works.
              </p>
            </div>

            <CulturalEvidence key={relationship.id} claims={relationship.culturalClaims} title="Comparison: cultural context & evidence" />

            {/* Evidence Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {relationship.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-sans text-stone-300 flex items-center gap-1.5"
                >
                  <span className="text-amber-400" aria-hidden="true">•</span>
                  <span>{ev.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment & Action Footer */}
          <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-col items-start gap-3">
              <p role={currentResult?.error ? 'alert' : 'status'} className="text-sm text-stone-200 font-sans leading-relaxed break-words">
                {isVerifying ? 'Requesting one text-only assessment…' : currentResult?.text || 'Optional Gemini check: one assessment of supplied text. No images are sent; no historical verification or multi-model consensus is performed.'}
              </p>
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="text-sm text-amber-300 hover:text-amber-200 underline font-sans transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Checking…' : 'Check with Gemini (text only)'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-sans text-stone-300 transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={() => {
                  request.current?.abort();
                  onArriveAtTarget();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-sans font-bold text-xs tracking-wider uppercase shadow-xl shadow-amber-500/20 transition-all"
              >
                Land in {targetArtwork.title} →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
