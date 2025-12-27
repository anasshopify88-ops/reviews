// ====== عدّل هذا للرابط حق الـ Worker ======
const API_BASE = "YOUR_WORKER_BASE"; // مثال: https://reviews-api.yourname.workers.dev

// Anti-spam timing guard
const MIN_SECONDS_BEFORE_SUBMIT = 3;
const pageLoadedAt = Date.now();

const form = document.getElementById("submit-review");
const nameEl = document.getElementById("name");
const jobEl = document.getElementById("job");
const reviewEl = document.getElementById("review");
const ratingInput = document.getElementById("rating");
const tsTokenEl = document.getElementById("tsToken");
const honeypotEl = document.getElementById("website");

const starWrap = document.getElementById("star-rating");
const reviewsContainer = document.getElementById("reviews-container");
const filterEl = document.getElementById("filter");
const loadMoreBtn = document.getElementById("load-more");
const toast = document.getElementById("toast");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");

let currentRatingFilter = "all";
let offset = 0;
const pageSize = 12;
let loading = false;

function containsForbidden(text) {
  const urlLike = /(https?:\/\/|www\.)\S+/i;
  const tldLike = /\b\S+\.(com|net|org|io|co|sa|me|app|dev|shop|store)\b/i;
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phoneish = /(\+?\d[\d\s\-()]{7,}\d)/;
  const html = /<|>|javascript:|data:/i;
  const atSign = /@/;

  return (
    urlLike.test(text) ||
    tldLike.test(text) ||
    email.test(text) ||
    phoneish.test(text) ||
    html.test(text) ||
    atSign.test(text)
  );
}

function tooSpammyText(text) {
  // فلتر بسيط لسبام متكرر جدًا (اختياري)
  const repeatedChars = /(.)\1{8,}/;
  const repeatedWords = /\b(\w+)\b(?:\s+\1\b){4,}/i;
  return repeatedChars.test(text) || repeatedWords.test(text);
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}

function clearError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function showToast(msg = "تم استلام رأيك، شكرًا لك!") {
  toast.querySelector("span").textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

function setStarUI(rating) {
  const stars = Array.from(starWrap.querySelectorAll("[data-value]"));
  stars.forEach((el) => {
    const v = Number(el.getAttribute("data-value"));
    if (v <= rating) {
      el.classList.remove("text-gray-300");
      el.classList.add("text-yellow-400");
      el.setAttribute("fill", "currentColor");
    } else {
      el.classList.remove("text-yellow-400");
      el.classList.add("text-gray-300");
      el.setAttribute("fill", "none");
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderStars(rating) {
  const r = Number(rating) || 0;
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="${i <= r ? "text-yellow-400" : "text-gray-300"}">★</span>`;
  return `<div class="text-lg leading-none" aria-label="${r} من 5">${out}</div>`;
}

function reviewCard(item) {
  const name = escapeHtml(item.name || "");
  const job = escapeHtml(item.job || "");
  const review = escapeHtml(item.review || "");
  const rating = Number(item.rating) || 0;

  return `
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
    <div class="flex items-start justify-between gap-3 mb-3">
      <div>
        <div class="font-semibold text-gray-800">${name}</div>
        <div class="text-sm text-gray-500">${job}</div>
      </div>
      ${renderStars(rating)}
    </div>
    <p class="text-gray-700 leading-relaxed">${review}</p>
  </div>`;
}

async function fetchReviews({ reset = false } = {}) {
  if (loading) return;
  loading = true;

  if (reset) {
    offset = 0;
    reviewsContainer.innerHTML = "";
    loadMoreBtn.disabled = false;
    loadMoreBtn.classList.remove("opacity-50");
  }

  const params = new URLSearchParams();
  params.set("limit", String(pageSize));
  params.set("offset", String(offset));
  params.set("rating", currentRatingFilter);

  try {
    loadMoreBtn.textContent = "جاري التحميل...";
    const res = await fetch(`${API_BASE}/reviews?${params.toString()}`, { method: "GET" });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.detail || data?.error || "خطأ في التحميل");

    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach((it) => reviewsContainer.insertAdjacentHTML("beforeend", reviewCard(it)));

    offset = data.nextOffset ?? (offset + items.length);

    if (items.length < pageSize) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.classList.add("opacity-50");
      loadMoreBtn.textContent = "لا يوجد المزيد";
    } else {
      loadMoreBtn.textContent = "عرض المزيد";
    }
  } catch (e) {
    loadMoreBtn.textContent = "عرض المزيد";
    alert(e.message || "حصل خطأ");
  } finally {
    loading = false;
  }
}

// ====== ستار ريتنج ======
starWrap.addEventListener("click", (e) => {
  const el = e.target.closest("[data-value]");
  if (!el) return;
  const v = Number(el.getAttribute("data-value"));
  if (!v || v < 1 || v > 5) return;
  ratingInput.value = String(v);
  setStarUI(v);
});

starWrap.addEventListener("mousemove", (e) => {
  const el = e.target.closest("[data-value]");
  if (!el) return;
  const v = Number(el.getAttribute("data-value"));
  if (!v) return;
  setStarUI(v);
});

starWrap.addEventListener("mouseleave", () => {
  const v = Number(ratingInput.value || 0);
  setStarUI(v);
});

// ====== Submit ======
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  // Honeypot (إذا تعبي = بوت)
  if (honeypotEl && (honeypotEl.value || "").trim().length > 0) {
    showError("تعذر إرسال الرأي.");
    return;
  }

  // Timing guard
  const seconds = (Date.now() - pageLoadedAt) / 1000;
  if (seconds < MIN_SECONDS_BEFORE_SUBMIT) {
    showError("فضلاً انتظر لحظات قبل الإرسال.");
    return;
  }

  const name = (nameEl.value || "").trim();
  const job = (jobEl.value || "").trim();
  const review = (reviewEl.value || "").trim();
  const rating = Number(ratingInput.value || 0);
  const tsToken = (tsTokenEl.value || "").trim();

  if (!name || !job || !review || !rating) {
    showError("فضلاً عبّئ جميع الحقول واختر التقييم بالنجوم.");
    return;
  }
  if (name.length > 30 || job.length > 40 || review.length > 400) {
    showError("تأكد من حدود الأحرف في الحقول.");
    return;
  }

  const allText = `${name} ${job} ${review}`;
  if (containsForbidden(allText)) {
    showError("ممنوع إضافة روابط أو بريد أو أرقام أو معلومات تواصل داخل الحقول.");
    return;
  }
  if (tooSpammyText(allText)) {
    showError("النص يبدو غير طبيعي. فضلاً اكتب رأيًا واضحًا ومختصرًا.");
    return;
  }

  // Turnstile required
  if (!tsToken) {
    showError("فضلاً أكمل التحقق (Turnstile) قبل الإرسال.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add("opacity-70");

  try {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, job, rating, review, tsToken }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.detail || data?.error || "تعذر إرسال الرأي");

    showToast();
    form.reset();
    ratingInput.value = "";
    setStarUI(0);

    // Reset Turnstile (لو موجود)
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      window.turnstile.reset();
    }
    if (tsTokenEl) tsTokenEl.value = "";

    await fetchReviews({ reset: true });
  } catch (err) {
    showError(err.message || "حصل خطأ");
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-70");
  }
});

// ====== Filter + Load more ======
filterEl.addEventListener("change", async () => {
  currentRatingFilter = filterEl.value || "all";
  await fetchReviews({ reset: true });
});

loadMoreBtn.addEventListener("click", () => fetchReviews({ reset: false }));

document.addEventListener("DOMContentLoaded", () => {
  setStarUI(0);
  fetchReviews({ reset: true });
});
