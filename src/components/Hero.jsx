import logo from "../assets/logo.jpg";
import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";

export default function Hero() {
  const { copy } = useLanguage();

  return (
    <section className="hero">
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />

      <div className="hero__topline">
        <BrandLine>{copy.hero.studio}</BrandLine>
        <span className="hero__edition">{copy.hero.edition}</span>
      </div>

      <div className="hero__composition">
        <div className="hero__copy">
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1>
            <span className="hero__title-word">{copy.hero.title}</span>
            <em className="hero__title-word hero__title-word--accent">{copy.hero.titleAccent}</em>
          </h1>
          <p className="hero__intro">{copy.hero.intro}</p>
          <a className="text-link" href="#treatments">
            {copy.hero.explore} <span>↓</span>
          </a>
        </div>

        <div className="hero__seal">
          <div className="hero__seal-ring" />
          <div className="hero__seal-inner">
            <img src={logo} alt="" aria-hidden="true" />
          </div>
        </div>

        <div className="hero__side-note">
          <span>01</span>
        </div>
      </div>

      <div className="hero__footer">
        <span>{copy.hero.scroll}</span>
        <div className="hero__scroll-line" />
       
      </div>
    </section>
  );
}