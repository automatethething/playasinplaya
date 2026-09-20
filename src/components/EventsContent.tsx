import Link from "next/link";
import { EventMap } from "@/components/EventMap";
import { GuideNav } from "@/components/GuideNav";
import { LumaCalendarEmbed } from "@/components/LumaCalendarEmbed";
import { formatCancunDateTime, getPublicEvents, isPublicEvent } from "@/lib/listings";

type EventsContentProps = {
  currentPath: "/" | "/events";
  heading: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Cancun" }).format(new Date(value));
}

export async function EventsContent({ currentPath, heading }: EventsContentProps) {
  const { items, unavailable } = await getPublicEvents();
  const events = items.filter((item) => isPublicEvent(item));

  return (
    <main className="bulletin-shell events-content">
      <header className="bulletin-masthead">
        <div>
          <p className="eyebrow">Playa del Carmen, Mexico</p>
          <p className="wordmark">Playas in Playa</p>
        </div>
        <div className="utility-rail"><Link href="/submit">Suggest a listing →</Link></div>
      </header>

      <section className="bulletin-hero events-hero">
        <div>
          <p className="section-kicker">The local week ahead</p>
          <h1>{heading}</h1>
        </div>
        <p className="hero-copy">A small, manually curated calendar. We link to the organizer&apos;s source; registration always happens there, not on Playas in Playa.</p>
      </section>

      <GuideNav currentPath={currentPath} />
      <LumaCalendarEmbed />

      {unavailable ? <section role="status" className="events-status"><p className="section-kicker">Calendar status</p><h2>Events are temporarily unavailable</h2><p>Please try again shortly. We have not shown unverified fallback listings.</p></section>
        : events.length > 0 ? <section className="events-layout" aria-label="Curated events and venue map">
          <div className="events-list">
            <div className="events-list-heading"><p className="section-kicker">Verified listings</p><h2>Curated events</h2></div>
            {events.map((event) => <article key={event.id} className="event-card">
              <div><h3>{event.title}</h3>{event.description && <p className="event-description">{event.description}</p>}</div>
              <dl className="event-details">
                <dt>When</dt><dd>{formatCancunDateTime(event.event_starts_at)} (Cancún time)</dd>
                <dt>Venue</dt><dd>{event.venue}</dd>
                <dt>Organizer</dt><dd>{event.organizer_name}</dd>
                <dt>Verified</dt><dd>{formatDate(event.last_verified_at)}</dd>
                {event.expires_at && <><dt>Listing expires</dt><dd>{formatDate(event.expires_at)}</dd></>}
              </dl>
              <a href={event.source_url} target="_blank" rel="noreferrer" className="event-source-link">View organizer source <span className="sr-only">(opens in a new tab)</span> ↗</a>
            </article>)}
          </div>
          <EventMap eventCount={events.length} />
        </section> : <section className="events-layout events-empty-layout"><div className="events-list"><div className="events-empty"><p className="section-kicker">Curated listings</p><h2>Nothing verified for the board yet.</h2><p>The live calendar above is the best place to find current plans. Send a public event for manual review if it should appear here.</p><Link href="/submit" className="event-source-link">Suggest an event →</Link></div></div><EventMap eventCount={0} /></section>}
    </main>
  );
}
