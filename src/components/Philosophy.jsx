import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";

export default function Philosophy() {
  const { copy } = useLanguage();

  return (
    <section className="philosophy section" id="philosophy">
      <div className="section-index">02</div>

      <div className="philosophy__statement reveal">
        <BrandLine>{copy.philosophy.label}</BrandLine>
        <p>{copy.philosophy.statement}</p>
      </div>

      <div className="philosophy__details">
        <div className="philosophy__number">B<span>W</span></div>
        <div>
          <p className="eyebrow">{copy.philosophy.eyebrow}</p>
          <p>{copy.philosophy.detail}</p>
        </div>
        <div className="philosophy__signature">beautywerk<span>®</span></div>
      </div>
    </section>
  );
}