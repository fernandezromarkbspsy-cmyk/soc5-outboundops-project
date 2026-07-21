export function MetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="metric-card metric-card--skeleton" aria-hidden="true">
          <span className="metric-icon skeleton-block" />
          <span>
            <small className="skeleton-block skeleton-line skeleton-line--short" />
            <strong className="skeleton-block skeleton-line skeleton-line--value" />
          </span>
        </article>
      ))}
    </>
  );
}
