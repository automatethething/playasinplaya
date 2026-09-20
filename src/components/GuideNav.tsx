import Link from "next/link";

const routes = [
  { href: "/", label: "Home" },
  { href: "/groups", label: "WhatsApp groups" },
  { href: "/events", label: "Events" },
  { href: "/deals", label: "Deals" },
  { href: "/tips", label: "Local tips" },
  { href: "/submit", label: "Submit" },
] as const;

export function GuideNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="guide-nav" aria-label="Guide sections">
      {currentPath !== "/" && <Link href="/" className="guide-back">← Guide home</Link>}
      <div className="guide-route-strip">
        {routes.map((route, index) => {
          const current = route.href === currentPath || (route.href === "/tips" && currentPath.startsWith("/tips"));
          return <Link key={route.href} href={route.href} aria-current={current ? "page" : undefined} className={`guide-route${current ? " guide-route-current" : ""}`}><span className="route-index">{String(index + 1).padStart(2, "0")}</span>{route.label}</Link>;
        })}
      </div>
    </nav>
  );
}
