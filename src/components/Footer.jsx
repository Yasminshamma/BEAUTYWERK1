import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.jpg";
import { useLanguage } from "../context/LanguageContext";
import { getBusinessHours } from "../lib/api";

export default function Footer() {
  const { language, copy } = useLanguage();
  const [intervals, setIntervals] = useState([]);
  const [hoursError, setHoursError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getBusinessHours({ signal: controller.signal })
      .then(({ intervals: storedIntervals }) => {
        setIntervals(storedIntervals);
        setHoursError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setHoursError(error.message);
      });
    return () => controller.abort();
  }, []);

  const weeklyHours = useMemo(() => Array.from({ length: 7 }, (_, weekday) => {
    const date = new Date(Date.UTC(2024, 0, 7 + weekday));
    const day = new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date);
    const dayIntervals = intervals.filter((interval) => interval.weekday === weekday);
    const times = dayIntervals.length
      ? dayIntervals.map(({ startTime, endTime }) => `${startTime}–${endTime}`).join(", ")
      : copy.footer.closed;
    return { day, times };
  }), [copy.footer.closed, intervals, language]);

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__identity">
          <a className="footer__brand" href="/" aria-label="Beautywerk home">
            <img src={logo} alt="Beautywerk Skin & Beauty Studio" />
          </a>
          <div>
            <span className="footer__studio-name">{copy.footer.studio}</span>
            <p>{copy.hero.intro}</p>
          </div>
        </div>
        <a className="footer__cta" href="/booking">
          {copy.nav.book}<span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="footer__cols">
        <div>
          <span>{copy.footer.explore}</span>
          <a href="/#treatments">{copy.nav.links[1]}<span aria-hidden="true">↗</span></a>
          <a href="/#gallery">{copy.nav.links[2]}<span aria-hidden="true">↗</span></a>
          <a href="/#reviews">{copy.nav.links[4]}<span aria-hidden="true">↗</span></a>
        </div>
        <div>
          <span>{copy.footer.visit}</span>
          <p>{copy.footer.studio}<br />{copy.footer.appointment}</p>
          <div className="footer__opening-hours">
            <span>{copy.footer.hours}</span>
            {hoursError ? (
              <p className="footer__hours-error" role="alert">{hoursError}</p>
            ) : (
              <ul>
                {weeklyHours.map(({ day, times }) => (
                  <li key={day}><span>{day}</span><time>{times}</time></li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <span>{copy.footer.connect}</span>
          <a href="mailto:hello@beautywerk.studio">
            hello@beautywerk.studio<span aria-hidden="true">↗</span>
          </a>
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