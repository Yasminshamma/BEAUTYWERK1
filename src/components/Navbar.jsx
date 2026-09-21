import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.jpg";
import { useLanguage } from "../context/LanguageContext";

const links = [
  ["#philosophy", "#philosophy"],
  ["#treatments", "#treatments"],
  ["#gallery", "#gallery"],
  ["#ritual", "#ritual"],
  ["#visit", "#visit"],
];

const languages = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export default function Navbar({ compact }) {
  const { language, setLanguage, copy } = useLanguage();
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!languageRef.current?.contains(event.target)) {
        setLanguageOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };

    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const changeLanguage = (lang) => {
    if (!languages.some(({ code }) => code === lang)) return;
    setLanguage(lang);
    setLanguageOpen(false);
  };

  const activeLanguage = languages.find(({ code }) => code === language) || languages[0];

  return (
    <header className={`nav ${compact ? "nav--compact" : ""}`}>
      <a className="nav__brand" href="#" aria-label="Beautywerk home">
        <img className="nav__brand-image" src={logo} alt="Beautywerk" />
      </a>

      <nav className={`nav__links ${open ? "is-open" : ""}`}>
        {links.map(([key, href], index) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {copy.nav.links[index]}
          </a>
        ))}
        <a className="nav__cta" href="#visit" onClick={() => setOpen(false)}>
          {copy.nav.book} <span>↗</span>
        </a>
        <div className="language-switcher" ref={languageRef}>
          <button
            className="language-switcher__trigger"
            type="button"
            aria-expanded={languageOpen}
            aria-haspopup="listbox"
            aria-label={`${copy.nav.language}: ${activeLanguage.label}`}
            onClick={() => setLanguageOpen((value) => !value)}
          >
            <span className="language-switcher__globe" aria-hidden="true">🌐</span>
            <span>EN / DE</span>
            <span className="language-switcher__active">{activeLanguage.code.toUpperCase()}</span>
            <span className={`language-switcher__chevron ${languageOpen ? "is-open" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {languageOpen && (
            <div className="language-switcher__menu" role="listbox" aria-label={copy.nav.chooseLanguage}>
              {languages.map(({ code }) => (
                <button
                  className={code === language ? "is-active" : ""}
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={code === language}
                  onClick={() => changeLanguage(code)}
                >
                  <span>{code.toUpperCase()}</span>
                  <span>{code === "en" ? copy.nav.english : copy.nav.german}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <button
        className="nav__menu"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
    </header>
  );
}