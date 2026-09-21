import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";

export default function Journal() {
  const { copy } = useLanguage();

  return (
    <section className="journal section">
      <div className="journal__header">
        <span className="section-index">06</span>
        <BrandLine>{copy.journal.label}</BrandLine>
        <p>{copy.journal.intro}</p>
      </div>

      <div className="journal__grid">
        {copy.journal.notes.map(([label, title], index) => (
          <article className="journal-card reveal" key={label}>
            <span>{label}</span>
            <div className="journal-card__mark">0{index + 1}</div>
            <h3>{title}</h3>
            <a href="#visit" className="text-link">{copy.journal.read} <span>↗</span></a>
          </article>
        ))}
      </div>
    </section>
  );
}