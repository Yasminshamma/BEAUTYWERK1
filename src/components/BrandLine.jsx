export default function BrandLine({ children }) {
  return (
    <div className="brand-line">
      <span className="brand-line__rule" />
      <span>{children}</span>
      <span className="brand-line__dot" />
    </div>
  );
}