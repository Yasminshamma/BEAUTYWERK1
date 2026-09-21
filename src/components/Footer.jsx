import logo from "../assets/logo.jpg";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { copy } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer__brand">
        <img src={logo} alt="Beautywerk Skin & Beauty Studio" />
      </div>
      <div className="footer__cols">
        <div>
          <span>{copy.footer.visit}</span>
          <p>{copy.footer.address}<br />Miami, FL</p>
        </div>
        <div>
          <span>{copy.footer.hours}</span>
          <p>{copy.footer.appointment}<br />{copy.footer.days}</p>
        </div>
        <div>
          <span>{copy.footer.connect}</span>
          <p><a href="mailto:hello@beautywerk.studio">{copy.footer.email}</a><br /><a href="#visit">{copy.footer.instagram}</a></p>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} Beautywerk</span>
        <span>{copy.footer.studio}</span>
        <span>{copy.footer.tagline}</span>
      </div>
    </footer>
  );
}