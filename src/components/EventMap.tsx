type EventMapProps = { eventCount: number };

export function EventMap({ eventCount }: EventMapProps) {
  if (!eventCount) {
    return (
      <aside className="events-map-panel events-verification-ledger" aria-label="How events are verified">
        <p className="section-kicker">Before it appears here</p>
        <h2>Every event earns its place.</h2>
        <ol>
          <li>Time and venue are recorded.</li>
          <li>The organizer source is checked.</li>
          <li>The listing gets a freshness date.</li>
        </ol>
        <p>When there are verified events with mapped venues, this panel becomes the area map.</p>
      </aside>
    );
  }

  return (
    <aside className="events-map-panel" aria-label="Map of Playa del Carmen events">
      <div className="events-map-frame">
        <iframe
          title="Playa del Carmen event map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-87.10%2C20.59%2C-86.98%2C20.68&layer=map"
          loading="lazy"
        />
        <div className="events-map-note"><strong>Venue map</strong><span>Pins will follow once approved venues have coordinates.</span></div>
      </div>
      <p className="events-map-attribution">Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors</p>
    </aside>
  );
}
