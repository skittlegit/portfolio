// Background — a flat, confident field under fine film grain. No gradients,
// no mesh, no lines. Pure CSS so it never threatens LCP; always above the
// field but behind content (z 1).
export default function Background() {
  return (
    <div aria-hidden="true">
      <div className="grain" />
    </div>
  );
}
