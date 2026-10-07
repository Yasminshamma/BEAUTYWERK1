async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(payload.error || "The request could not be completed.");
  }

  return payload;
}

export function getReviews({ signal } = {}) {
  return request("/api/reviews", { signal });
}

export function getServices({ signal } = {}) {
  return request("/api/services", { signal });
}

export function getGallery({ signal } = {}) {
  return request("/api/gallery", { signal });
}

export function getBusinessHours({ signal } = {}) {
  return request("/api/business-hours", { signal });
}

export function getAvailability({ date, serviceId, signal }) {
  const query = new URLSearchParams({ date, serviceId: String(serviceId) });
  return request(`/api/availability?${query}`, { signal });
}

export function createReview(review) {
  return request("/api/reviews", {
    method: "POST",
    body: JSON.stringify(review),
  });
}

export function createBooking(booking) {
  return request("/api/bookings", {
    method: "POST",
    body: JSON.stringify(booking),
  });
}

export function adminRequest(path, token, options = {}) {
  return request(path, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
