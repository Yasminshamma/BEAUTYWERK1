import { useLanguage } from "../context/LanguageContext";

export default function Ritual() {
  const { copy } = useLanguage();

  return (
    <section className="ritual section" id="ritual">
      <div className="ritual__visual reveal">
        <div className="ritual__circle ritual__circle--outer" />
        <div className="ritual__circle ritual__circle--gold" />
        <div className="ritual__circle ritual__circle--inner">
          <span>BW</span>
        </div>
        <div className="ritual__arc" />
        <span className="ritual__caption">{copy.ritual.caption}</span>
      </div>

      <div className="ritual__copy reveal">
        <span className="section-index">05</span>
        <p className="eyebrow">{copy.ritual.eyebrow}</p>
        <h2>{copy.ritual.title}<br /><em>{copy.ritual.titleAccent}</em></h2>
        <p>{copy.ritual.detail}</p>
        <div className="ritual__facts">
          {copy.ritual.facts.map((fact, index) => (
            <div key={fact}><strong>0{index + 1}</strong><span>{fact}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}