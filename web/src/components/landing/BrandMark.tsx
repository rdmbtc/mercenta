/** Optimized transparent-canvas crop of the user's original mercenta-logo.png. */
export default function BrandMark({ className = "" }: { className?: string }) {
  // The surrounding brand name or scene label supplies the accessible name.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`mx-brand-mark ${className}`} src="/mercenta-mark.webp" alt="" width="384" height="359" decoding="async" />;
}
