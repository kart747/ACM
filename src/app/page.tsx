'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/v2/Navbar';
import { HeroSection } from '@/components/v2/HeroSection';
import { GalleryView } from '@/components/v2/GalleryView';
import { ImmersiveStage } from '@/components/v2/ImmersiveStage';
import { MotifDrawer } from '@/components/v2/MotifDrawer';
import { MotifTravelModal } from '@/components/v2/MotifTravelModal';
import { JourneyTrail } from '@/components/v2/JourneyTrail';
import { GeminiInspectorModal } from '@/components/v2/GeminiInspectorModal';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';
import { validateCreativeDna } from '@/lib/creative-dna/validate';
import type { ArtworkData, ElementData, RelationshipData, JourneyHop } from '@/components/v2/types';

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<'hero' | 'gallery' | 'stage'>('hero');
  const [artworks, setArtworks] = useState<ArtworkData[]>(V2_ARTWORKS as ArtworkData[]);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkData>(V2_ARTWORKS[0] as ArtworkData);
  const [elements, setElements] = useState<ElementData[]>([]);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [relationships, setRelationships] = useState<RelationshipData[]>([]);
  const [activeTravelRel, setActiveTravelRel] = useState<RelationshipData | null>(null);
  const [journeyHops, setJourneyHops] = useState<JourneyHop[]>([
    { artwork: V2_ARTWORKS[0] as ArtworkData, timestamp: new Date().toLocaleTimeString() }
  ]);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Fetch all artworks from API on mount
  useEffect(() => {
    async function loadArtworks() {
      try {
        const res = await fetch('/api/artworks');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setArtworks(data);
            setSelectedArtwork(data[0]);
          }
        }
      } catch (err) {
        console.warn('Using local V2 artworks corpus fallback');
      }
    }
    loadArtworks();
  }, []);

  // Fetch elements whenever selected artwork changes
  useEffect(() => {
    async function loadElements() {
      try {
        const res = await fetch(`/api/artworks/${selectedArtwork.id}/elements`);
        if (res.ok) {
          const data = await res.json();
          setElements(data);
          return;
        }
      } catch (e) {
        // Fallback
      }
      setElements((V2_ELEMENTS[selectedArtwork.id] as ElementData[]) || []);
    }
    loadElements();
    setSelectedElement(null);
  }, [selectedArtwork]);

  // Handle selecting an element to discover motif relationships
  const handleSelectElement = async (elem: ElementData) => {
    setSelectedElement(elem);
    try {
      const res = await fetch('/api/relationships/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: selectedArtwork.id, elementId: elem.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setRelationships(data);
        return;
      }
    } catch (e) {
      // Fallback
    }
    const local = (V2_RELATIONSHIPS as RelationshipData[]).filter(
      (r) => r.sourceArtworkId === selectedArtwork.id && r.sourceElementId === elem.id
    );
    setRelationships(local);
  };

  // User chooses an artwork from gallery
  const handleSelectArtworkFromGallery = (art: ArtworkData) => {
    setSelectedArtwork(art);
    setCurrentScreen('stage');
    setJourneyHops((prev) => [
      ...prev,
      { artwork: art, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  // User initiates travel transition
  const handleTravel = (rel: RelationshipData) => {
    setActiveTravelRel(rel);
  };

  // Complete travel and land on target artwork
  const handleArriveAtTarget = () => {
    if (!activeTravelRel) return;
    const target = artworks.find((a) => a.id === activeTravelRel.targetArtworkId);
    if (target) {
      setSelectedArtwork(target);
      setActiveTravelRel(null);
      setSelectedElement(null);
      setCurrentScreen('stage');
      setJourneyHops((prev) => [
        ...prev,
        { artwork: target, timestamp: new Date().toLocaleTimeString() },
      ]);
    }
  };

  // Target element helper for travel modal
  const targetElement = activeTravelRel
    ? (V2_ELEMENTS[activeTravelRel.targetArtworkId] as ElementData[])?.find(
        (e) => e.id === activeTravelRel.targetElementId
      ) || null
    : null;

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-amber-500/30 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenInspector={() => setInspectorOpen(true)}
      />

      {/* Main Screen Views */}
      <main className="relative">
        {currentScreen === 'hero' && (
          <>
            <HeroSection onExplore={() => setCurrentScreen('gallery')} />
            <GalleryView
              artworks={artworks}
              onSelectArtwork={handleSelectArtworkFromGallery}
            />
          </>
        )}

        {currentScreen === 'gallery' && (
          <div className="pt-20">
            <GalleryView
              artworks={artworks}
              onSelectArtwork={handleSelectArtworkFromGallery}
            />
          </div>
        )}

        {currentScreen === 'stage' && (
          <ImmersiveStage
            artwork={selectedArtwork}
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={handleSelectElement}
            onBackToGallery={() => setCurrentScreen('gallery')}
            onAnalyzeGemini={() => setInspectorOpen(true)}
          />
        )}
      </main>

      {/* Slide-out Motif Drawer */}
      <MotifDrawer
        element={selectedElement}
        relationships={relationships}
        allArtworks={artworks}
        onClose={() => setSelectedElement(null)}
        onTravel={handleTravel}
      />

      {/* Climax Travel Modal ("The Motif Travels") */}
      <MotifTravelModal
        relationship={activeTravelRel}
        sourceArtwork={
          activeTravelRel
            ? artworks.find((a) => a.id === activeTravelRel.sourceArtworkId) || null
            : null
        }
        targetArtwork={
          activeTravelRel
            ? artworks.find((a) => a.id === activeTravelRel.targetArtworkId) || null
            : null
        }
        sourceElement={selectedElement}
        targetElement={targetElement}
        onClose={() => setActiveTravelRel(null)}
        onArriveAtTarget={handleArriveAtTarget}
      />

      {/* Persistent Journey Trail ("Your Path") */}
      <JourneyTrail
        hops={journeyHops}
        onSelectHop={(hop) => {
          setSelectedArtwork(hop.artwork);
          setCurrentScreen('stage');
        }}
        onClearTrail={() =>
          setJourneyHops([
            { artwork: selectedArtwork, timestamp: new Date().toLocaleTimeString() },
          ])
        }
      />

      {/* Gemini Live Multimodal Inspector Modal */}
      <GeminiInspectorModal
        artworks={artworks}
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
      />
    </div>
  );
}
