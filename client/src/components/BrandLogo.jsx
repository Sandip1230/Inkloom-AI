import logoImage from "../../inkloom logo.png";

export default function BrandLogo({ className = "" }) {
  return <img src={logoImage} alt="" aria-hidden="true" className={className} />;
}
