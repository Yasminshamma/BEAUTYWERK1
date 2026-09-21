import { useLanguage } from "../context/LanguageContext";

const images = [
  {
    src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=85",
    className: "gallery-card gallery-card--large",
    position: "center",
  },
  {
    src: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85",
    className: "gallery-card gallery-card--tall",
    position: "center",
  },
  {
    src: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=85",
    className: "gallery-card gallery-card--small",
    position: "center",
  },
  {
    src: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1200&q=85",
    className: "gallery-card gallery-card--wide",
    position: "center",
  },
];

export default function Gallery() {
  const { copy } = useLanguage();

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

      <div className="gallery__grid">
        {images.map((image, index) => (
          <figure className={`${image.className} reveal`} key={image.src}>
            <img src={image.src} alt={copy.gallery.alts[index]} loading="lazy" style={{ objectPosition: image.position }} />
            <figcaption>
              <span>0{index + 1}</span>
              <span>{copy.gallery.captions[index]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}