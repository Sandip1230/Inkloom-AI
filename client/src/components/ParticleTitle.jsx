export default function ParticleTitle({ children, className = "" }) {
  return (
    <span className={`inkloom-particle-title ${className}`}>
      <span className="inkloom-particle-title__text">{children}</span>
      <span aria-hidden="true" className="inkloom-particle-title__dust" />
    </span>
  );
}
