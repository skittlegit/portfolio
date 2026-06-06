// Background — a soft, slow-drifting colour mesh (warm + violet) under fine film
// grain. No grid/lines. Pure CSS so it never threatens LCP; the drift pauses
// under reduced-motion via globals.css. Always behind content (z 0/1).
export default function Background() {
  return (
    <div aria-hidden="true">
      <div className="bg-mesh" />
      <div className="grain" />
    </div>
  );
}
