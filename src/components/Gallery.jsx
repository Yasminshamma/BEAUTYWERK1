import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getGallery } from "../lib/api";

export default function Gallery() {
  const { language, copy } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    getGallery({ signal: controller.signal })
      .then(({ items: storedItems }) => {
        setItems(storedItems);
        setLoadError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message || copy.gallery.error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount]);

  return (
    <section className="gallery section" id="gallery">
      <div className="gallery__header">
        <div>
          <span className="section-index">04</span>
          <div className="brand-line">
            <span className="brand-line__rule" />
            <span>{copy.gallery.label}</span>
            <span className="brand-line__dot" />
          </div>
        </div>
        <p className="gallery__intro">{copy.gallery.intro}</p>
      </div>

      {loading && <p className="reviews__status" role="status">{copy.gallery.loading}</p>}
      {loadError && (
        <div className="reviews__status reviews__status--error" role="alert">
          <p>{loadError || copy.gallery.error}</p>
          <button className="button button--quiet" type="button" onClick={() => setReloadCount((count) => count + 1)}>
            {copy.gallery.retry}
          </button>
        </div>
      )}
      {!loading && !loadError && items.length > 0 && (
        <div className="gallery__grid">
          {items.map((item, index) => (
            <figure className={`gallery-card gallery-card--${item.layoutKey} reveal`} key={item.id}>
              <img
                src={item.imageUrl}
                alt={item[`alt${language === "de" ? "De" : "En"}`]}
                loading="lazy"
                style={{ objectPosition: item.objectPosition }}
              />
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{item[`caption${language === "de" ? "De" : "En"}`]}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
