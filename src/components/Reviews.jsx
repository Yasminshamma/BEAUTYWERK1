import { useEffect, useState } from "react";
import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";
import { createReview, getReviews } from "../lib/api";

export default function Reviews() {
  const { copy } = useLanguage();
  const [savedReviews, setSavedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 800px)").matches);
  const [currentPage, setCurrentPage] = useState(0);
  const reviews = savedReviews;
  const pageSize = isMobile ? 1 : 3;
  const pageCount = Math.ceil(reviews.length / pageSize);
  const visibleReviews = reviews.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 800px)");
    const updateScreenSize = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateScreenSize);
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getReviews({ signal: controller.signal })
      .then(({ reviews: storedReviews }) => {
        setSavedReviews(storedReviews);
        setLoadError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message || copy.reviews.loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [copy.reviews.loadError]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount - 1));
  }, [pageCount]);

  const submitReview = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitted(false);

    try {
      await createReview({
        author: author.trim(),
        quote: quote.trim(),
        rating,
        treatment: copy.reviews.treatment,
      });
      setAuthor("");
      setQuote("");
      setRating(5);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || copy.reviews.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews section" id="reviews">
      <div className="reviews__header reveal">
        <span className="section-index">07</span>
        <BrandLine>{copy.reviews.label}</BrandLine>
        <h2>{copy.reviews.title}<br /><em>{copy.reviews.titleAccent}</em></h2>
        <p>{copy.reviews.intro}</p>
      </div>

      {loading && <p className="reviews__status" role="status">{copy.reviews.loading}</p>}
      {loadError && <p className="reviews__status reviews__status--error" role="alert">{loadError}</p>}
      {!loading && !loadError && reviews.length === 0 && (
        <p className="reviews__status">{copy.reviews.empty}</p>
      )}

      {reviews.length > 0 && <div className="reviews__grid">
        {visibleReviews.map((review, index) => {
          const reviewIndex = currentPage * pageSize + index;
          return (
            <article
              className="review-card"
              key={review.id}
            >
              <div className="review-card__topline">
                <span className="review-card__number">{String(reviewIndex + 1).padStart(2, "0")}</span>
                <span className="review-card__stars" aria-label={`${review.rating || 5} ${copy.reviews.stars}`}>
                  {Array.from({ length: 5 }, (_, starIndex) => (
                    starIndex < (review.rating || 5) ? "★" : "☆"
                  ))}
                </span>
              </div>
              <span className="review-card__quote-mark" aria-hidden="true">“</span>
              <blockquote>{review.quote}</blockquote>
              <div className="review-card__author">
                <span className="review-card__initial">{review.author.charAt(0)}</span>
                <div>
                  <strong>{review.author}</strong>
                  <span>{review.treatment}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>}

      {reviews.length > 0 && pageCount > 1 && (
        <nav className="reviews__pagination" aria-label={copy.reviews.pagination}>
          <button
            className="reviews__page-arrow"
            type="button"
            aria-label={copy.reviews.previous}
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            ←
          </button>
          <span className="reviews__page-count" aria-live="polite">
            {String(currentPage + 1).padStart(2, "0")}
            <span aria-hidden="true"> / </span>
            {String(pageCount).padStart(2, "0")}
          </span>
          <button
            className="reviews__page-arrow"
            type="button"
            aria-label={copy.reviews.next}
            disabled={currentPage === pageCount - 1}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            →
          </button>
        </nav>
      )}

      <a className="button button--dark reviews__cta" href="/booking">
        {copy.reviews.book} <span>↗</span>
      </a>
      <button
        className="button button--quiet reviews__add"
        type="button"
        aria-expanded={formOpen}
        aria-controls="review-form"
        onClick={() => setFormOpen((open) => !open)}
      >
        {formOpen ? copy.reviews.cancel : copy.reviews.add}
      </button>

      {formOpen && (
        <form className="review-form" id="review-form" onSubmit={submitReview}>
          <h3>{copy.reviews.formTitle}</h3>
          <label htmlFor="review-author">{copy.reviews.name}</label>
          <input
            id="review-author"
            name="author"
            autoComplete="name"
            maxLength={60}
            placeholder={copy.reviews.namePlaceholder}
            required
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />

          <span className="review-form__label">{copy.reviews.ratingLabel}</span>
          <div className="review-form__rating" role="group" aria-label={copy.reviews.ratingLabel}>
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} ${copy.reviews.stars}`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                >
                  {value <= rating ? "★" : "☆"}
                </button>
              );
            })}
          </div>

          <label htmlFor="review-quote">{copy.reviews.review}</label>
          <textarea
            id="review-quote"
            name="review"
            maxLength={500}
            placeholder={copy.reviews.reviewPlaceholder}
            required
            rows={4}
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
          />
          <button className="button button--dark" type="submit" disabled={submitting}>
            {submitting ? copy.reviews.submitting : copy.reviews.submit}
          </button>
          {submitError && <p className="review-form__status review-form__status--error" role="alert">{submitError}</p>}
          {submitted && <p className="review-form__status" role="status">{copy.reviews.success}</p>}
        </form>
      )}
    </section>
  );
}
