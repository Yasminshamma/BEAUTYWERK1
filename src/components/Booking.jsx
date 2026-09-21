import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";

export default function Booking() {
  const { copy } = useLanguage();

  return (
    <section className="booking section" id="visit">
      <div className="booking__stamp">
        <span>BEAUTY</span>
        <span>WERK</span>
        <span>SKIN & BEAUTY STUDIO</span>
      </div>

      <div className="booking__content reveal">
        <span className="section-index">07</span>
        <BrandLine>{copy.booking.label}</BrandLine>
        <h2>{copy.booking.title}<br /><em>{copy.booking.titleAccent}</em></h2>
        <p>{copy.booking.detail}</p>
        <div className="booking__actions">
          <a className="button button--dark" href="mailto:hello@beautywerk.studio">
            {copy.booking.request} <span>↗</span>
          </a>
          <a className="button button--quiet" href="tel:+10000000000">
            {copy.booking.call}
          </a>
        </div>
      </div>
    </section>
  );
}