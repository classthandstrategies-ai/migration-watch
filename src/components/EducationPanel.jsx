import { dataset } from '../lib/dataset.js';

/**
 * Educational section: how animal tracking works, why it matters for
 * conservation, and full, prominent attribution to the source studies and
 * Movebank. Attribution is treated as primary content, not fine print.
 */
export default function EducationPanel() {
  return (
    <section id="about" className="mx-auto mt-[100px] max-w-[1000px] px-6">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[36px] leading-[1.15] text-ink-black md:text-[44px]">
            How a bird becomes a dataset
          </h2>
          <div className="mt-5 space-y-4 font-rubik text-[17px] leading-[1.75] text-charcoal">
            <p>
              Each path on this map began with a lightweight GPS logger — often solar-powered and
              weighing just a few grams — fitted to an animal as a backpack-style harness or leg
              band. The tag records the animal&apos;s position at set intervals and relays it back
              over the mobile network or by satellite (Argos), or stores it until the tag is
              recovered.
            </p>
            <p>
              Researchers upload these fixes to{' '}
              <a
                href="https://www.movebank.org"
                target="_blank"
                rel="noreferrer"
                className="text-ink-black underline underline-offset-2"
              >
                Movebank
              </a>
              , a free platform hosted by the Max Planck Institute of Animal Behavior that archives
              animal movement data from thousands of studies worldwide and lets owners share it
              under open licences.
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-[36px] leading-[1.15] text-ink-black md:text-[44px]">
            Why it matters
          </h2>
          <div className="mt-5 space-y-4 font-rubik text-[17px] leading-[1.75] text-charcoal">
            <p>
              Migration tracking turns a single tagged animal into evidence for an entire
              population. It reveals the stopover wetlands a flyway depends on, exposes where routes
              cross shipping lanes, wind farms or hunting grounds, and shows how warming seas and
              shifting food shift the journeys themselves.
            </p>
            <p>
              The waved albatross shown here is critically endangered; the white stork is a
              conservation success story that rebuilt its European range. Both stories were written
              with data exactly like this — which is why open, well-attributed sharing of tracking
              data is itself an act of conservation.
            </p>
          </div>
        </div>
      </div>

      {/* Attribution — given the visual weight it deserves. */}
      <div className="mt-12 rounded-[10px] border border-charcoal/15 bg-bone-card px-6 py-6">
        <h3 className="font-rubik text-[12px] font-semibold uppercase tracking-[0.16em] text-charcoal">
          Data sources &amp; attribution
        </h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {dataset.studies.map((s) => (
            <div key={s.id}>
              <p className="font-rubik text-[15px] font-medium text-ink-black">{s.name}</p>
              <p className="mt-1 font-rubik text-[13px] leading-relaxed text-charcoal">
                {s.citation}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-[46px] bg-sage-mint px-2.5 py-0.5 font-rubik text-[11px] font-semibold text-ink-black">
                  {s.license}
                </span>
                <a
                  href={s.doiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-rubik text-[12px] text-charcoal underline underline-offset-2 hover:text-ink-black"
                >
                  {s.doiUrl}
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-charcoal/15 pt-4 font-rubik text-[13px] leading-relaxed text-charcoal">
          Tracking data accessed via the{' '}
          <a
            href="https://github.com/movebank/movebank-api-doc"
            target="_blank"
            rel="noreferrer"
            className="text-ink-black underline underline-offset-2"
          >
            Movebank public data API
          </a>{' '}
          on {dataset.fetchDate}. Both datasets are released under CC0 1.0; attribution is provided
          here as good scholarly practice. This project is an independent visualisation and is not
          affiliated with or endorsed by Movebank, the Max Planck Institute, or the data owners.
        </p>
      </div>
    </section>
  );
}
