'use client';

interface CreativeDnaExplainerProps {
  onExplore: () => void;
}

export function CreativeDnaExplainer({ onExplore }: CreativeDnaExplainerProps) {
  return (
    <section aria-labelledby="concept" className="mx-auto max-w-5xl px-6 py-16 text-stone-300">
      <p className="mb-3 text-xs uppercase tracking-widest text-amber-300">From an artwork to a connection</p>
      <h2 id="concept" tabIndex={-1} className="scroll-mt-24 rounded font-serif text-3xl text-white outline-offset-4 focus-visible:outline focus-visible:outline-amber-300 sm:text-4xl">
        How CreativeDNA works
      </h2>
      <p className="mt-5 max-w-3xl text-base leading-relaxed">
        CreativeDNA is ARTSCAPE’s structured record of an artwork: its source, selected details, visual descriptions, and proposed connections to other works. A motif is a subject, shape, or visual detail you can follow across images.
      </p>
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-serif text-lg text-amber-300">1. Start with a real work</h3>
          <p className="mt-3 text-sm leading-relaxed">Each image has a museum or photograph source. Credits and licences identify where it came from. Source records and cultural evidence are kept separate from visual interpretations.</p>
        </li>
        <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-serif text-lg text-amber-300">2. Select a motif</h3>
          <p className="mt-3 text-sm leading-relaxed">Open an artwork and choose a numbered region or detail button. The highlight is a hand-drawn guide, not live object detection or a precise cutout. The panel explains what to notice and what remains uncertain.</p>
        </li>
        <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-serif text-lg text-amber-300">3. Follow a comparison</h3>
          <p className="mt-3 text-sm leading-relaxed">Under Visual Comparisons, choose Travel to compare two works, then land on the related detail. These are proposed visual connections—not proof of shared origins or historical influence. Some details have no comparison yet.</p>
        </li>
      </ol>
      <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
        <h3 className="font-serif text-xl text-white">Where Gemini fits</h3>
        <p className="mt-3 text-sm leading-relaxed">Browsing, motif travel, and prepared guided stories work without Gemini. Starting a story reads a saved story or a prepared guide; it does not call the model. Only an explicit generation request sends the selected image and its context to gemini-3.8-flash.</p>
        <p className="mt-3 text-sm leading-relaxed">The optional analysis and relationship checks use text only. AI output stays labeled as interpretation, and a failed story request falls back to the prepared guide. Live web research, automatic motif discovery, and arbitrary image uploads are not part of the current experience.</p>
      </div>
      <button onClick={onExplore} className="mt-7 rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-300 focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-amber-300">
        Explore motifs in the gallery →
      </button>
    </section>
  );
}
