import { useEffect, useMemo, useState } from "react";
import BrandLine from "./BrandLine";
import { useLanguage } from "../context/LanguageContext";
import { createBooking, getAvailability, getServices } from "../lib/api";
import { formatServiceMeta } from "../lib/formatService";

export default function Booking({ selectedService, onServiceChange }) {
  const { language, copy } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [servicesError, setServicesError] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const services = useMemo(() => categories.flatMap((category) => category.services), [categories]);
  const selectedRecord = services.find(({ id }) => String(id) === String(selectedService));
  const needsTime = selectedRecord?.bookable === true;

  useEffect(() => {
    const controller = new AbortController();
    getServices({ signal: controller.signal })
      .then(({ categories: storedCategories }) => {
        setCategories(storedCategories);
        setServicesError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setServicesError(error.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setTime("");
    setAvailableTimes([]);
    setAvailabilityError("");
    setAvailabilityLoading(false);
    if (!needsTime || !date || !selectedRecord) return undefined;

    const controller = new AbortController();
    setAvailabilityLoading(true);
    getAvailability({ date, serviceId: selectedRecord.id, signal: controller.signal })
      .then(({ slots }) => {
        setAvailableTimes(slots);
        setAvailabilityError("");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setAvailabilityError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [date, needsTime, selectedRecord?.id]);

  const requestAppointment = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!selectedRecord) {
      setSubmitError(copy.booking.chooseService);
      return;
    }
    const formData = new FormData(form);
    setSubmitting(true);
    setSubmitError("");
    setSubmitted(false);

    try {
      await createBooking({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        serviceId: selectedRecord.id,
        date: needsTime ? date : "",
        time: needsTime ? time : "",
        message: formData.get("message"),
      });
      form.reset();
      onServiceChange("");
      setDate("");
      setTime("");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || copy.booking.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="booking section" id="visit">
      <div className="booking__stamp">
        <span>BEAUTY</span>
        <span>WERK</span>
        <span>SKIN & BEAUTY STUDIO</span>
      </div>

      <div className="booking__content reveal">
        <span className="section-index">08</span>
        <BrandLine>{copy.booking.label}</BrandLine>
        <h2>{copy.booking.title}<br /><em>{copy.booking.titleAccent}</em></h2>
        <p>{copy.booking.detail}</p>
        <form className="booking-form" onSubmit={requestAppointment}>
          <div className="booking-form__fields">
            <div className="booking-form__field">
              <label htmlFor="booking-name">{copy.booking.name}</label>
              <input id="booking-name" name="name" autoComplete="name" required />
            </div>
            <div className="booking-form__field">
              <label htmlFor="booking-email">{copy.booking.email}</label>
              <input id="booking-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="booking-form__field">
              <label htmlFor="booking-phone">{copy.booking.phone}</label>
              <input id="booking-phone" name="phone" type="tel" autoComplete="tel" />
            </div>
            <div className="booking-form__field">
              <label htmlFor="booking-service">{copy.booking.service}</label>
              <select
                id="booking-service"
                name="service"
                onChange={(event) => {
                  onServiceChange(event.target.value);
                  setDate("");
                  setTime("");
                }}
                required
                value={selectedService}
              >
                <option value="" disabled>{copy.booking.chooseService}</option>
                {categories.map((category) => (
                  <optgroup label={category.title[language]} key={category.id}>
                    {category.services.map((service) => (
                      <option value={service.id} key={service.id}>
                        {service.title[language]} — {formatServiceMeta(service, language)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {servicesError && <p className="booking-form__status booking-form__status--error" role="alert">{servicesError}</p>}
            </div>
            {needsTime ? (
              <>
                <div className="booking-form__field booking-form__field--full">
                  <label htmlFor="booking-date">{copy.booking.date}</label>
                  <input
                    id="booking-date"
                    name="date"
                    type="date"
                    min={minDate}
                    onChange={(event) => setDate(event.target.value)}
                    required
                    value={date}
                  />
                </div>
                <div className="booking-form__field booking-form__field--full">
                  <label htmlFor="booking-time">{copy.booking.time}</label>
                  <select
                    id="booking-time"
                    name="time"
                    onChange={(event) => setTime(event.target.value)}
                    required
                    value={time}
                    disabled={!date || availabilityLoading || availableTimes.length === 0}
                  >
                    <option value="" disabled>
                      {date ? copy.booking.chooseTime : copy.booking.chooseDateFirst}
                    </option>
                    {availableTimes.map((slot) => <option value={slot} key={slot}>{slot}</option>)}
                  </select>
                  {availabilityLoading && <p className="booking-form__status" role="status">{copy.booking.loadingTimes}</p>}
                  {availabilityError && <p className="booking-form__status booking-form__status--error" role="alert">{availabilityError}</p>}
                  {date && !availabilityLoading && !availabilityError && availableTimes.length === 0 && (
                    <p className="booking-form__status" role="status">{copy.booking.noTimes}</p>
                  )}
                </div>
              </>
            ) : selectedRecord?.bookingMode === "consultation" ? (
              <div className="booking-form__field booking-form__field--full">
                <p className="booking-form__status" role="status">{copy.booking.consultationNotice}</p>
              </div>
            ) : null}
            <div className="booking-form__field booking-form__field--full">
              <label htmlFor="booking-message">{copy.booking.message}</label>
              <textarea id="booking-message" name="message" rows="3" />
            </div>
          </div>
          {submitError && <p className="booking-form__status booking-form__status--error" role="alert">{submitError}</p>}
          {submitted && <p className="booking-form__status" role="status">{copy.booking.success}</p>}
          <div className="booking__actions">
            <button className="button button--dark" type="submit" disabled={submitting || Boolean(servicesError) || !selectedRecord}>
              {submitting ? copy.booking.submitting : copy.booking.request} <span>↗</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
