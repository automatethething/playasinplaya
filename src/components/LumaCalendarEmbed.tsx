export function LumaCalendarEmbed() {
  return (
    <section className="luma-calendar" aria-labelledby="luma-calendar-heading">
      <div>
        <p className="section-kicker">Live source</p>
        <h2 id="luma-calendar-heading">More happening in Playa</h2>
        <p><a href="https://luma.com/playadelcarmen" target="_blank" rel="noreferrer">Browse the public Luma calendar</a>. Registration and event details stay with the organizer.</p>
      </div>
      <iframe
        title="Live Luma events in Playa del Carmen"
        src="https://luma.com/embed/calendar/cal-8QsN0OjVFEipsG8/events"
        loading="lazy"
        allowFullScreen
      />
    </section>
  );
}
