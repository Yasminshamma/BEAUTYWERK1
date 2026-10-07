import { useEffect, useMemo, useState } from "react";
import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";
import { getServices } from "../lib/api";
import { formatServiceMeta } from "../lib/formatService";

export default function Services() {
  const { language, copy } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getServices({ signal: controller.signal })
      .then(({ categories: storedCategories }) => {
        setCategories(storedCategories);
        setSelectedCategoryId((current) => (
          storedCategories.some(({ id }) => id === current)
            ? current
            : storedCategories[Math.min(1, storedCategories.length - 1)]?.id ?? null
        ));
        setLoadError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount]);

  const category = useMemo(
    () => categories.find(({ id }) => id === selectedCategoryId) || categories[0],
    [categories, selectedCategoryId],
  );

  return (
    <section className="services section" id="treatments">
      <div className="section-heading reveal">
        <div>
          <span className="section-index">03</span>
          <BrandLine>{copy.services.label}</BrandLine>
          <h1 className="treatments__title">{copy.services.pageTitle}</h1>
        </div>
        <p>{copy.services.intro}</p>
      </div>

      {loading && <p className="reviews__status" role="status">{copy.services.loading}</p>}
      {loadError && (
        <div className="reviews__status reviews__status--error" role="alert">
          <p>{loadError}</p>
          <button className="button button--quiet" type="button" onClick={() => setReloadCount((count) => count + 1)}>
            {copy.services.retry}
          </button>
        </div>
      )}

      {!loading && !loadError && categories.length > 0 && category && (
        <div className="treatments__layout">
          <div className="treatment-tabs" role="tablist" aria-label={copy.services.categoryLabel}>
            {categories.map((item, index) => (
              <button
                aria-controls="treatment-panel"
                aria-selected={category.id === item.id}
                className={`treatment-tabs__button ${category.id === item.id ? "is-active" : ""}`}
                id={`treatment-tab-${item.id}`}
                key={item.id}
                onClick={() => setSelectedCategoryId(item.id)}
                role="tab"
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{item.title[language]}</span>
                <span className="treatment-tabs__count">{String(item.services.length).padStart(2, "0")}</span>
              </button>
            ))}
          </div>

          <div
            aria-labelledby={`treatment-tab-${category.id}`}
            className="treatments__panel"
            id="treatment-panel"
            role="tabpanel"
          >
            <div className="treatments__panel-heading">
              <span>{copy.services.options}</span>
              <span>{String(category.services.length).padStart(2, "0")}</span>
            </div>
            <h2>{category.title[language]}</h2>
            <div className="treatment-cards">
              {category.services.map((service, index) => (
                <article className="treatment-card" key={service.id}>
                  <div className="treatment-card__topline">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{category.title[language]}</span>
                  </div>
                  <h3>{service.title[language]}</h3>
                  {service.description[language] && <p>{service.description[language]}</p>}
                  <div className="treatment-card__footer">
                    <strong>{formatServiceMeta(service, language)}</strong>
                    <a href={`/booking?service=${encodeURIComponent(service.id)}`}>
                      {service.bookable ? copy.services.book : copy.services.consult}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
