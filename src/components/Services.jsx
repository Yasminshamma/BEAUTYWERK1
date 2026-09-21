import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";

export default function Services() {
  const { copy } = useLanguage();

  return (
    <section className="services section" id="treatments">
      <div className="section-heading reveal">
        <div>
          <span className="section-index">03</span>
            <BrandLine>{copy.services.label}</BrandLine>
        </div>
        <p>
          {copy.services.intro}
        </p>
      </div>

      <div className="service-list">
        {copy.services.items.map((service, index) => (
          <article className="service-row reveal" key={service.title}>
            <span className="service-row__number">0{index + 1}</span>
            <h2>{service.title}</h2>
            <p>{service.text}</p>
            <span className="service-row__meta">{service.meta}</span>
            <span className="service-row__arrow">↗</span>
          </article>
        ))}
      </div>
    </section>
  );
}