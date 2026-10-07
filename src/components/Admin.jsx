import { useCallback, useEffect, useState } from "react";
import { adminRequest } from "../lib/api";
import "../styles/admin.css";

const tokenKey = "beautywerk-admin-token";
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const sections = [
  ["overview", "Overview"],
  ["bookings", "Bookings"],
  ["reviews", "Reviews"],
  ["services", "Treatments"],
  ["gallery", "Gallery"],
  ["hours", "Opening hours"],
];

function emptyService(categoryId = "") {
  return {
    id: null,
    categoryId: String(categoryId),
    slug: "",
    titleEn: "",
    titleDe: "",
    descriptionEn: "",
    descriptionDe: "",
    durationMinutes: "",
    displayDurationMinutes: "",
    approximateDuration: false,
    price: "",
    compareAtPrice: "",
    currency: "EUR",
    priceNoteEn: "",
    priceNoteDe: "",
    bookingMode: "appointment",
    isActive: true,
    sortOrder: 0,
  };
}

function serviceDraft(service) {
  return {
    id: service.id,
    categoryId: String(service.categoryId),
    slug: service.slug,
    titleEn: service.title.en,
    titleDe: service.title.de,
    descriptionEn: service.description.en,
    descriptionDe: service.description.de,
    durationMinutes: service.durationMinutes ?? "",
    displayDurationMinutes: service.displayDurationMinutes ?? "",
    approximateDuration: service.approximateDuration,
    price: service.priceMinor === null ? "" : (service.priceMinor / 100).toFixed(2),
    compareAtPrice: service.compareAtPriceMinor === null ? "" : (service.compareAtPriceMinor / 100).toFixed(2),
    currency: service.currency,
    priceNoteEn: service.priceNote.en,
    priceNoteDe: service.priceNote.de,
    bookingMode: service.bookingMode,
    isActive: service.isActive,
    sortOrder: service.sortOrder,
  };
}

function emptyGallery() {
  return {
    id: null,
    imageUrl: "",
    layoutKey: "small",
    objectPosition: "center",
    captionEn: "",
    captionDe: "",
    altEn: "",
    altDe: "",
    sortOrder: 0,
    isActive: true,
  };
}

function dateLabel(value) {
  if (!value) return "No date selected";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function priceMinor(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : Number.NaN;
}

export default function Admin() {
  const [token, setToken] = useState(() => window.sessionStorage.getItem(tokenKey) || "");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(Boolean(window.sessionStorage.getItem(tokenKey)));
  const [tokenInput, setTokenInput] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [data, setData] = useState({
    bookings: [],
    reviews: [],
    categories: [],
    services: [],
    gallery: [],
    intervals: [],
  });
  const [serviceForm, setServiceForm] = useState(null);
  const [galleryForm, setGalleryForm] = useState(null);
  const [hoursDraft, setHoursDraft] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async (accessToken) => {
    const [bookingData, reviewData, categoryData, serviceData, galleryData, hoursData] = await Promise.all([
      adminRequest("/api/admin/bookings", accessToken),
      adminRequest("/api/admin/reviews", accessToken),
      adminRequest("/api/admin/categories", accessToken),
      adminRequest("/api/admin/services", accessToken),
      adminRequest("/api/admin/gallery", accessToken),
      adminRequest("/api/business-hours", accessToken),
    ]);
    setData({
      bookings: bookingData.bookings,
      reviews: reviewData.reviews,
      categories: categoryData.categories,
      services: serviceData.services,
      gallery: galleryData.items,
      intervals: hoursData.intervals,
    });
    setHoursDraft(hoursData.intervals);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    setChecking(true);
    loadData(token)
      .then(() => {
        if (!cancelled) setAuthenticated(true);
      })
      .catch((loadError) => {
        if (cancelled) return;
        window.sessionStorage.removeItem(tokenKey);
        setToken("");
        setAuthenticated(false);
        setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadData, token]);

  async function runAction(key, action, successMessage) {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      await action();
      await loadData(token);
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusy("");
    }
  }

  async function signIn(event) {
    event.preventDefault();
    const enteredToken = tokenInput.trim();
    if (!enteredToken) {
      setError("Enter the admin access token.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      await loadData(enteredToken);
      window.sessionStorage.setItem(tokenKey, enteredToken);
      setToken(enteredToken);
      setAuthenticated(true);
      setTokenInput("");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setChecking(false);
    }
  }

  function signOut() {
    window.sessionStorage.removeItem(tokenKey);
    setToken("");
    setAuthenticated(false);
    setError("");
    setNotice("");
  }

  async function saveService(event) {
    event.preventDefault();
    const duration = serviceForm.durationMinutes === "" ? null : Number(serviceForm.durationMinutes);
    const displayDuration = serviceForm.displayDurationMinutes === "" ? null : Number(serviceForm.displayDurationMinutes);
    const payload = {
      categoryId: Number(serviceForm.categoryId),
      slug: serviceForm.slug.trim(),
      titleEn: serviceForm.titleEn.trim(),
      titleDe: serviceForm.titleDe.trim(),
      descriptionEn: serviceForm.descriptionEn.trim(),
      descriptionDe: serviceForm.descriptionDe.trim(),
      durationMinutes: duration,
      displayDurationMinutes: displayDuration,
      approximateDuration: serviceForm.approximateDuration,
      priceMinor: priceMinor(serviceForm.price),
      compareAtPriceMinor: priceMinor(serviceForm.compareAtPrice),
      currency: serviceForm.currency.trim().toUpperCase(),
      priceNoteEn: serviceForm.priceNoteEn.trim(),
      priceNoteDe: serviceForm.priceNoteDe.trim(),
      bookingMode: serviceForm.bookingMode,
      isActive: serviceForm.isActive,
      sortOrder: Number(serviceForm.sortOrder),
    };
    if ([payload.priceMinor, payload.compareAtPriceMinor].some(Number.isNaN)) {
      setError("Enter valid non-negative prices.");
      return;
    }
    await runAction("service-save", async () => {
      await adminRequest(
        serviceForm.id ? `/api/admin/services/${serviceForm.id}` : "/api/admin/services",
        token,
        { method: serviceForm.id ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setServiceForm(null);
    }, "Treatment saved.");
  }

  async function saveGalleryItem(event) {
    event.preventDefault();
    await runAction("gallery-save", async () => {
      await adminRequest(
        galleryForm.id ? `/api/admin/gallery/${galleryForm.id}` : "/api/admin/gallery",
        token,
        { method: galleryForm.id ? "PUT" : "POST", body: JSON.stringify(galleryForm) },
      );
      setGalleryForm(null);
    }, "Gallery item saved.");
  }

  async function saveHours(event) {
    event.preventDefault();
    const intervals = hoursDraft.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }));
    await runAction("hours-save", () => adminRequest("/api/admin/business-hours", token, {
      method: "PUT",
      body: JSON.stringify({ intervals }),
    }), "Opening hours updated.");
  }

  const requestedBookings = data.bookings.filter(({ status }) => status === "requested").length;
  const pendingReviews = data.reviews.filter(({ status }) => status === "pending").length;

  if (!authenticated) {
    return (
      <main className="admin-login">
        <a className="admin-login__brand" href="/">BEAUTYWERK <span>STUDIO ADMIN</span></a>
        <form className="admin-login__card" onSubmit={signIn}>
          <p className="admin-eyebrow">Private workspace</p>
          <h1>Welcome back.</h1>
          <p>Enter the server admin token to manage bookings and studio content.</p>
          <label>
            Admin access token
            <input
              autoComplete="current-password"
              onChange={(event) => setTokenInput(event.target.value)}
              type="password"
              value={tokenInput}
              required
            />
          </label>
          {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
          <button className="admin-primary" disabled={checking} type="submit">
            {checking ? "Checking access…" : "Sign in"}
          </button>
          <a className="admin-back-link" href="/">← Return to website</a>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-sidebar__brand" href="/">BEAUTYWERK<span>STUDIO ADMIN</span></a>
        <p className="admin-sidebar__label">Workspace</p>
        <nav aria-label="Admin sections">
          {sections.map(([id, label]) => (
            <button
              aria-current={activeSection === id ? "page" : undefined}
              className={activeSection === id ? "is-active" : ""}
              key={id}
              onClick={() => { setActiveSection(id); setError(""); setNotice(""); }}
              type="button"
            >
              <span>{label}</span>
              {id === "bookings" && requestedBookings > 0 && <b>{requestedBookings}</b>}
              {id === "reviews" && pendingReviews > 0 && <b>{pendingReviews}</b>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <a href="/">View website <span>↗</span></a>
          <button onClick={signOut} type="button">Sign out</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Beautywerk / Management</p>
            <h1>{sections.find(([id]) => id === activeSection)?.[1]}</h1>
          </div>
          <button
            className="admin-secondary"
            disabled={Boolean(busy)}
            onClick={() => runAction("refresh", async () => {}, "Data refreshed.")}
            type="button"
          >
            Refresh data
          </button>
          <button className="admin-mobile-signout" onClick={signOut} type="button">Sign out</button>
        </header>
        {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
        {notice && <p className="admin-alert admin-alert--success" role="status">{notice}</p>}

        {activeSection === "overview" && (
          <div className="admin-overview">
            <div className="admin-stats">
              <article><span>Appointment requests</span><strong>{requestedBookings}</strong><small>Awaiting your response</small></article>
              <article><span>All bookings</span><strong>{data.bookings.length}</strong><small>Stored in your SQLite database</small></article>
              <article><span>Reviews to review</span><strong>{pendingReviews}</strong><small>Pending moderation</small></article>
              <article><span>Active treatments</span><strong>{data.services.filter(({ isActive }) => isActive).length}</strong><small>Visible on the website</small></article>
            </div>
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <div><p className="admin-eyebrow">Latest activity</p><h2>Recent bookings</h2></div>
                <button className="admin-text-button" onClick={() => setActiveSection("bookings")} type="button">View all →</button>
              </div>
              <BookingTable bookings={data.bookings.slice(0, 5)} busy={busy} onStatusChange={(booking, status) => runAction(`booking-${booking.id}`, () => adminRequest(`/api/admin/bookings/${booking.id}`, token, { method: "PATCH", body: JSON.stringify({ status }) }), "Booking status updated.")} />
            </section>
          </div>
        )}

        {activeSection === "bookings" && (
          <section className="admin-panel">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">Client requests</p><h2>Bookings</h2></div><span className="admin-count">{data.bookings.length} records</span></div>
            <BookingTable bookings={data.bookings} busy={busy} onStatusChange={(booking, status) => runAction(`booking-${booking.id}`, () => adminRequest(`/api/admin/bookings/${booking.id}`, token, { method: "PATCH", body: JSON.stringify({ status }) }), "Booking status updated.")} />
          </section>
        )}

        {activeSection === "reviews" && (
          <section className="admin-panel">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">Guest feedback</p><h2>Review moderation</h2></div><span className="admin-count">{data.reviews.length} records</span></div>
            {data.reviews.length === 0 ? <EmptyState text="No reviews have been submitted yet." /> : (
              <div className="admin-review-list">
                {data.reviews.map((review) => (
                  <article className="admin-review" key={review.id}>
                    <div className="admin-review__head">
                      <div><strong>{review.author}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>
                      <StatusPill status={review.status} />
                    </div>
                    <blockquote>“{review.quote}”</blockquote>
                    <p>{review.treatment || "Studio visit"} · {new Date(review.createdAt).toLocaleDateString()}</p>
                    <div className="admin-actions">
                      {["pending", "published", "hidden"].map((status) => (
                        <button
                          className={review.status === status ? "is-selected" : ""}
                          disabled={busy === `review-${review.id}`}
                          key={status}
                          onClick={() => runAction(`review-${review.id}`, () => adminRequest(`/api/admin/reviews/${review.id}`, token, { method: "PATCH", body: JSON.stringify({ status }) }), "Review moderation saved.")}
                          type="button"
                        >
                          {status === "published" ? "Publish" : status === "hidden" ? "Hide" : "Mark pending"}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "services" && (
          <section className="admin-panel">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">Catalog & pricing</p><h2>Treatments</h2></div><button className="admin-primary admin-primary--compact" onClick={() => setServiceForm(emptyService(data.categories[0]?.id))} type="button">Add treatment</button></div>
            {serviceForm ? (
              <ServiceEditor
                categories={data.categories}
                form={serviceForm}
                onCancel={() => setServiceForm(null)}
                onChange={setServiceForm}
                onSubmit={saveService}
                saving={busy === "service-save"}
              />
            ) : (
              <div className="admin-record-list">
                {data.services.map((service) => (
                  <article className="admin-record" key={service.id}>
                    <div>
                      <strong>{service.title.en}</strong>
                      <span>{service.title.de} · {service.durationMinutes ? `${service.durationMinutes} min` : "Consultation"}</span>
                    </div>
                    <span>{service.priceMinor === null ? "Price on request" : new Intl.NumberFormat(undefined, { style: "currency", currency: service.currency }).format(service.priceMinor / 100)}</span>
                    <StatusPill status={service.isActive ? "active" : "hidden"} />
                    <button className="admin-outline-button" onClick={() => setServiceForm(serviceDraft(service))} type="button">Edit</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "gallery" && (
          <section className="admin-panel">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">Visual content</p><h2>Gallery images</h2></div><button className="admin-primary admin-primary--compact" onClick={() => setGalleryForm(emptyGallery())} type="button">Add image</button></div>
            {galleryForm ? (
              <GalleryEditor
                form={galleryForm}
                onCancel={() => setGalleryForm(null)}
                onChange={setGalleryForm}
                onSubmit={saveGalleryItem}
                saving={busy === "gallery-save"}
              />
            ) : (
              <div className="admin-gallery-list">
                {data.gallery.map((item) => (
                  <article className="admin-gallery-item" key={item.id}>
                    <img alt="" src={item.imageUrl} />
                    <div><strong>{item.captionEn}</strong><span>{item.captionDe}</span><StatusPill status={item.isActive ? "active" : "hidden"} /></div>
                    <button className="admin-outline-button" onClick={() => setGalleryForm({ ...item })} type="button">Edit</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === "hours" && (
          <section className="admin-panel">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">When guests can visit</p><h2>Opening hours</h2></div></div>
            <form className="admin-hours" onSubmit={saveHours}>
              {weekdays.map((day, weekday) => {
                const interval = hoursDraft.find((entry) => entry.weekday === weekday) || {
                  weekday, startTime: "09:00", endTime: "17:00", enabled: false,
                };
                const enabled = hoursDraft.some((entry) => entry.weekday === weekday);
                return (
                  <div className="admin-hours__row" key={day}>
                    <label className="admin-switch"><input checked={enabled} onChange={(event) => {
                      setHoursDraft((current) => event.target.checked
                        ? [...current.filter((entry) => entry.weekday !== weekday), { weekday, startTime: "09:00", endTime: "17:00" }]
                        : current.filter((entry) => entry.weekday !== weekday));
                    }} type="checkbox" /><span /></label>
                    <strong>{day}</strong>
                    {enabled ? (
                      <div className="admin-hours__times">
                        <input aria-label={`${day} opening time`} onChange={(event) => setHoursDraft((current) => current.map((entry) => entry.weekday === weekday ? { ...entry, startTime: event.target.value } : entry))} type="time" value={interval.startTime} />
                        <span>to</span>
                        <input aria-label={`${day} closing time`} onChange={(event) => setHoursDraft((current) => current.map((entry) => entry.weekday === weekday ? { ...entry, endTime: event.target.value } : entry))} type="time" value={interval.endTime} />
                      </div>
                    ) : <span className="admin-muted">Closed</span>}
                  </div>
                );
              })}
              <div className="admin-form__footer"><p>Hours that conflict with existing future appointments cannot be saved.</p><button className="admin-primary" disabled={Boolean(busy)} type="submit">{busy === "hours-save" ? "Saving…" : "Save opening hours"}</button></div>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}

function BookingTable({ bookings, busy, onStatusChange }) {
  if (bookings.length === 0) return <EmptyState text="No bookings to display." />;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Guest</th><th>Treatment</th><th>Appointment</th><th>Status</th><th>Manage</th></tr></thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td><strong>{booking.name}</strong><a href={`mailto:${booking.email}`}>{booking.email}</a>{booking.phone && <span>{booking.phone}</span>}</td>
              <td>{booking.service}</td>
              <td>{dateLabel(booking.date)}{booking.time && <span>{booking.time}{booking.endTime ? ` – ${booking.endTime}` : ""}</span>}</td>
              <td><StatusPill status={booking.status} /></td>
              <td>
                <select
                  aria-label={`Booking status for ${booking.name}`}
                  disabled={busy === `booking-${booking.id}`}
                  onChange={(event) => onStatusChange(booking, event.target.value)}
                  value={booking.status}
                >
                  <option value="requested">Requested</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceEditor({ categories, form, onChange, onSubmit, onCancel, saving }) {
  const field = (key, label, options = {}) => (
    <label className={options.full ? "admin-field admin-field--full" : "admin-field"} key={key}>
      {label}
      <input
        required={options.required}
        min={options.min}
        onChange={(event) => onChange({ ...form, [key]: event.target.value })}
        type={options.type || "text"}
        value={form[key]}
      />
    </label>
  );
  return (
    <form className="admin-editor" onSubmit={onSubmit}>
      <div className="admin-editor__heading"><h3>{form.id ? "Edit treatment" : "Add treatment"}</h3><button className="admin-text-button" onClick={onCancel} type="button">Close</button></div>
      <div className="admin-form-grid">
        {field("titleEn", "English name", { required: true })}
        {field("titleDe", "German name", { required: true })}
        {field("slug", "URL slug", { required: true })}
        <label className="admin-field">Category<select onChange={(event) => onChange({ ...form, categoryId: event.target.value })} required value={form.categoryId}>{categories.map((category) => <option key={category.id} value={category.id}>{category.titleEn}</option>)}</select></label>
        {field("descriptionEn", "English description", { full: true })}
        {field("descriptionDe", "German description", { full: true })}
        {field("durationMinutes", "Reserved minutes", { type: "number", min: 1 })}
        {field("displayDurationMinutes", "Displayed minutes", { type: "number", min: 1 })}
        {field("price", "Price", { type: "number", min: 0 })}
        {field("compareAtPrice", "Compare-at price", { type: "number", min: 0 })}
        {field("currency", "Currency", { required: true })}
        {field("sortOrder", "Display order", { type: "number", required: true })}
        {field("priceNoteEn", "English price note")}
        {field("priceNoteDe", "German price note")}
        <label className="admin-field">Booking type<select onChange={(event) => onChange({ ...form, bookingMode: event.target.value })} value={form.bookingMode}><option value="appointment">Appointment</option><option value="consultation">Consultation</option><option value="unavailable">Unavailable</option></select></label>
        <label className="admin-checkbox"><input checked={form.isActive} onChange={(event) => onChange({ ...form, isActive: event.target.checked })} type="checkbox" />Visible on website</label>
        <label className="admin-checkbox"><input checked={form.approximateDuration} onChange={(event) => onChange({ ...form, approximateDuration: event.target.checked })} type="checkbox" />Duration is approximate</label>
      </div>
      <div className="admin-form__footer"><span>Prices are entered in the selected currency.</span><div><button className="admin-secondary" onClick={onCancel} type="button">Cancel</button><button className="admin-primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save treatment"}</button></div></div>
    </form>
  );
}

function GalleryEditor({ form, onChange, onSubmit, onCancel, saving }) {
  const fields = [
    ["imageUrl", "Image URL", "url"],
    ["captionEn", "English caption", "text"],
    ["captionDe", "German caption", "text"],
    ["altEn", "English alt text", "text"],
    ["altDe", "German alt text", "text"],
    ["objectPosition", "Image position", "text"],
  ];
  return (
    <form className="admin-editor" onSubmit={onSubmit}>
      <div className="admin-editor__heading"><h3>{form.id ? "Edit gallery image" : "Add gallery image"}</h3><button className="admin-text-button" onClick={onCancel} type="button">Close</button></div>
      <div className="admin-form-grid">
        {fields.map(([key, label, type]) => (
          <label className="admin-field" key={key}>{label}<input onChange={(event) => onChange({ ...form, [key]: event.target.value })} required type={type} value={form[key]} /></label>
        ))}
        <label className="admin-field">Layout<select onChange={(event) => onChange({ ...form, layoutKey: event.target.value })} value={form.layoutKey}><option value="large">Large</option><option value="tall">Tall</option><option value="small">Small</option><option value="wide">Wide</option></select></label>
        <label className="admin-field">Display order<input onChange={(event) => onChange({ ...form, sortOrder: Number(event.target.value) })} type="number" value={form.sortOrder} /></label>
        <label className="admin-checkbox"><input checked={form.isActive} onChange={(event) => onChange({ ...form, isActive: event.target.checked })} type="checkbox" />Visible on website</label>
      </div>
      <div className="admin-form__footer"><span>Use an HTTPS image URL or a local site asset path.</span><div><button className="admin-secondary" onClick={onCancel} type="button">Cancel</button><button className="admin-primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save image"}</button></div></div>
    </form>
  );
}

function StatusPill({ status }) {
  return <span className={`admin-status admin-status--${status}`}>{status}</span>;
}

function EmptyState({ text }) {
  return <p className="admin-empty">{text}</p>;
}
