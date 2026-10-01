'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/v2/Navbar';
import { HeroSection } from '@/components/v2/HeroSection';
import { CreativeDnaExplainer } from '@/components/v2/CreativeDnaExplainer';
import { GalleryView } from '@/components/v2/GalleryView';
import { ImmersiveStage } from '@/components/v2/ImmersiveStage';
import { MotifDrawer } from '@/components/v2/MotifDrawer';
import { MotifTravelModal } from '@/components/v2/MotifTravelModal';
import { JourneyTrail } from '@/components/v2/JourneyTrail';
import { GeminiInspectorModal } from '@/components/v2/GeminiInspectorModal';
import { GuidedStoryPanel } from '@/components/v2/GuidedStoryPanel';
import { useGuidedStory } from '@/components/v2/useGuidedStory';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';
import type { ArtworkData, ElementData, RelationshipData, JourneyHop } from '@/components/v2/types';

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<'hero' | 'gallery' | 'stage'>('hero');
  const [selection, setSelection] = useState<{ artworkId: string; elementId: string | null }>({
    artworkId: V2_ARTWORKS[0].id,
    elementId: null,
  });
  const [activeTravelRel, setActiveTravelRel] = useState<RelationshipData | null>(null);
  const [journeyHops, setJourneyHops] = useState<JourneyHop[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // The API serves this same bundled corpus; derive details together to avoid stale cross-artwork responses.
  const artworks = V2_ARTWORKS;
  const selectedArtwork = artworks.find(art => art.id === selection.artworkId) ?? artworks[0];
  const elements = V2_ELEMENTS[selectedArtwork.id] ?? [];
  const selectedElement = elements.find(element => element.id === selection.elementId) ?? null;
  const tour = useGuidedStory(selectedArtwork, elements, currentScreen === 'stage');
  const relationships = selectedElement
    ? V2_RELATIONSHIPS.filter(rel => rel.sourceArtworkId === selectedArtwork.id && rel.sourceElementId === selectedElement.id)
    : [];
  const targetElement = activeTravelRel
    ? V2_ELEMENTS[activeTravelRel.targetArtworkId]?.find(element => element.id === activeTravelRel.targetElementId) ?? null
    : null;

  useEffect(() => {
    if (currentScreen === 'hero' && window.location.hash === '#concept') {
      const concept = document.getElementById('concept');
      concept?.focus({ preventScroll: true });
      concept?.scrollIntoView({ block: 'start' });
    } else if (currentScreen === 'stage' && (selection.elementId || tour.active) && window.matchMedia?.('(max-width: 1023px)').matches) {
      document.querySelector('[data-artwork-canvas]')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentScreen, selectedArtwork.id, selection.elementId, tour.active]);

  const clearElement = () => setSelection(previous => ({ ...previous, elementId: null }));
  const startStory = () => { clearElement(); setActiveTravelRel(null); void tour.start(); };
  const selectElement = (element: ElementData) => {
    tour.stop();
    setSelection({ artworkId: selectedArtwork.id, elementId: element.id });
  };
  const openInspector = () => { tour.pause(); setInspectorOpen(true); };
  const navigate = (screen: 'hero' | 'gallery' | 'stage') => {
    if (window.location.hash === '#concept') {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
    tour.stop();
    clearElement();
    setActiveTravelRel(null);
    setCurrentScreen(screen);
    if (screen === currentScreen && screen !== 'stage') window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const visitArtwork = (artwork: ArtworkData, element?: ElementData, record = true) => {
    tour.stop();
    setSelection({ artworkId: artwork.id, elementId: element?.id ?? null });
    setActiveTravelRel(null);
    setCurrentScreen('stage');
    if (record) {
      setJourneyHops(previous => [...previous, { artwork, element, timestamp: new Date().toLocaleTimeString() }]);
    }
  };
  const handleTravel = (relationship: RelationshipData) => {
    if (relationships.some(rel => rel.id === relationship.id)) setActiveTravelRel(relationship);
  };
  const arrive = () => {
    const artwork = artworks.find(art => art.id === activeTravelRel?.targetArtworkId);
    if (artwork && targetElement) visitArtwork(artwork, targetElement);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-amber-500/30 selection:text-white">
      <Navbar currentScreen={currentScreen} onNavigate={navigate} onOpenInspector={openInspector} />
      <main>
        {currentScreen === 'hero' && (
          <>
            <HeroSection onExplore={() => navigate('gallery')} />
            <CreativeDnaExplainer onExplore={() => navigate('gallery')} />
            <GalleryView artworks={artworks} onSelectArtwork={artwork => visitArtwork(artwork)} />
          </>
        )}
        {currentScreen === 'gallery' && (
          <div className="pt-20 pb-24">
            <GalleryView artworks={artworks} onSelectArtwork={artwork => visitArtwork(artwork)} />
          </div>
        )}
        {currentScreen === 'stage' && (
          <ImmersiveStage
            key={selectedArtwork.id}
            artwork={selectedArtwork}
            elements={elements}
            selectedElement={selectedElement}
            onSelectElement={selectElement}
            onClearElement={() => { tour.stop(); clearElement(); }}
            onBackToGallery={() => navigate('gallery')}
            onAnalyzeGemini={openInspector}
            onStartStory={startStory}
            storyActive={tour.active}
            focusedElement={tour.focusedElement}
          />
        )}
      </main>
      <GuidedStoryPanel artwork={selectedArtwork} controller={tour} onExploreDetail={() => { if (tour.focusedElement) selectElement(tour.focusedElement); }} />
      <MotifDrawer
        artwork={selectedArtwork}
        element={currentScreen === 'stage' && !activeTravelRel && !tour.active ? selectedElement : null}
        relationships={relationships}
        allArtworks={artworks}
        onClose={clearElement}
        onTravel={handleTravel}
      />
      <MotifTravelModal
        key={activeTravelRel?.id ?? 'no-travel'}
        relationship={activeTravelRel}
        sourceArtwork={artworks.find(art => art.id === activeTravelRel?.sourceArtworkId) ?? null}
        targetArtwork={artworks.find(art => art.id === activeTravelRel?.targetArtworkId) ?? null}
        sourceElement={selectedElement}
        targetElement={targetElement}
        onClose={() => setActiveTravelRel(null)}
        onArriveAtTarget={arrive}
      />
      <JourneyTrail
        hops={journeyHops}
        onSelectHop={hop => visitArtwork(hop.artwork, hop.element, false)}
        onClearTrail={() => setJourneyHops([{ artwork: selectedArtwork, element: selectedElement ?? undefined, timestamp: new Date().toLocaleTimeString() }])}
      />
      <GeminiInspectorModal artworks={artworks} isOpen={inspectorOpen} onClose={() => setInspectorOpen(false)} />
    </div>
  );
}
