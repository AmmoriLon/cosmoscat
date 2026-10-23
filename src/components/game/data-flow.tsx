export function DataFlow({
  from,
  to,
  tone,
}: {
  from: string;
  to: string;
  tone: "capture" | "dump";
}) {
  return (
    <div className={`data-flow ${tone === "capture" ? "text-copper" : "text-teal"}`} aria-label={`Поток данных: ${from} → ${to}`}>
      <span className="w-12 shrink-0 text-[11px]">{from}</span>
      <span className="packet-track" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${i * 0.16}s` }} />
        ))}
      </span>
      <span className="w-12 shrink-0 text-right text-[11px]">{to}</span>
    </div>
  );
}
