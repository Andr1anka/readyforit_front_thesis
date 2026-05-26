import { useEffect, useState, useCallback } from "react";
import Header from "./layout/Header";
import Avatar from "./Avatar";
import { searchInterviewers, getInterviewerTags } from "../api/interviewerApi";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: "default", label: "За замовчуванням" },
  { value: "price_asc", label: "Ціна: спершу дешевші" },
  { value: "price_desc", label: "Ціна: спершу дорожчі" },
  { value: "rank_desc", label: "Рейтинг: найвищий" },
];

export default function InterviewerListPage({ onLogout, onNavigate, current }) {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [page, setPage] = useState(0);

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getInterviewerTags().then(setAllTags).catch(() => {});
  }, []);

  const load = useCallback(async (pageToLoad) => {
    setLoading(true);
    setError("");
    try {
      const res = await searchInterviewers({
        tags: selectedTags,
        minPrice: minPrice === "" ? null : Number(minPrice),
        maxPrice: maxPrice === "" ? null : Number(maxPrice),
        search: search.trim() || null,
        sort,
        page: pageToLoad,
        size: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося завантажити список");
    } finally {
      setLoading(false);
    }
  }, [selectedTags, minPrice, maxPrice, search, sort]);

  useEffect(() => {
    setPage(0);
    load(0);
    // eslint-disable-next-line
  }, [selectedTags, minPrice, maxPrice, sort]);

  const applySearch = (e) => {
    e.preventDefault();
    setPage(0);
    load(0);
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    );
  };

  const addCustomTag = (e) => {
    e.preventDefault();
    const t = customTag.trim();
    if (t && !selectedTags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setSelectedTags((prev) => [...prev, t]);
    }
    setCustomTag("");
  };

  const resetFilters = () => {
    setSelectedTags([]);
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
    setSort("default");
  };

  const goToPage = (p) => {
    if (p < 0 || p >= data.totalPages) return;
    setPage(p);
    load(p);
  };

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="il-page">
        <aside className="il-filters il-filters-modern">
          <div className="il-filter-title">
            <h3>Фільтри</h3>
            {(selectedTags.length > 0 || minPrice || maxPrice) && (
              <button type="button" className="ghost-btn small" onClick={resetFilters}>Очистити</button>
            )}
          </div>

          <div className="il-filter-group">
            <h4>Спеціалізація</h4>
            <div className="il-tag-list il-tag-grid">
              {allTags.length === 0 && <p className="hint">Немає міток</p>}
              {allTags.map((tag) => {
                const active = selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`il-tag-filter ${active ? "active" : ""}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <form onSubmit={addCustomTag} className="il-custom-tag">
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Своя мітка..."
              />
              <button type="submit" className="ghost-btn small">+</button>
            </form>
            {selectedTags.length > 0 && (
              <div className="il-selected-tags">
                {selectedTags.map((t) => (
                  <span key={t} className="tag-chip">
                    {t}
                    <button type="button" onClick={() => toggleTag(t)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="il-filter-group">
            <h4>Діапазон цін</h4>
            <div className="il-price-row">
              <input
                type="number" min="0" placeholder="Мін"
                value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                type="number" min="0" placeholder="Макс"
                value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
        </aside>

        <section className="il-results">
          <div className="il-results-head">
            <h1>Заняття</h1>
            <div className="il-sort">
              <span>Сортувати:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={applySearch} className="il-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук за назвою заняття, інтерв'юером або темою..."
            />
            <button type="submit" className="ghost-btn">Пошук</button>
          </form>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="il-loading">Завантаження...</div>
          ) : data.content.length === 0 ? (
            <div className="info-message">Нічого не знайдено за обраними фільтрами.</div>
          ) : (
            <>
              <div className="il-card-list">
                {data.content.map((c) => (
                  <article key={c.id} className="il-card">
                    <div className="il-card-avatar">
                      <Avatar
                        user={{ initials: initialsOf(c), firstName: c.name, lastName: c.lastName }}
                        src={buildApiFileUrl(c.photo)}
                        size={64}
                      />
                    </div>
                    <div className="il-card-body">
                      <div className="il-card-top">
                        <div>
                          <h3>{c.title || "Заняття"}</h3>
                          <p className="il-card-teacher">{c.name} {c.lastName}</p>
                        </div>
                        <div className="il-card-price">{c.price} грн</div>
                      </div>
                      <div className="il-card-tags">
                        {(c.tags || []).map((t) => <span key={t} className="tag-chip static">{t}</span>)}
                      </div>
                      <p className="il-card-desc"><strong>Опис:</strong> {c.shortDescription}</p>
                      <div className="il-card-meta-line">
                        {c.experienceYears != null && <span><strong>Досвід:</strong> {experienceLabel(c.experienceYears)}</span>}
                        {c.effectiveDurationMinutes != null && <span><strong>Тривалість:</strong> {c.effectiveDurationMinutes} хв</span>}
                      </div>
                      <div className="il-card-actions">
                        <button
                          className="submit-btn"
                          onClick={() => onNavigate?.("lesson-details:" + c.id)}
                        >
                          Детальніше
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {data.totalPages > 1 && (
                <div className="il-pagination">
                  <button className="ghost-btn small" disabled={data.page === 0}
                    onClick={() => goToPage(data.page - 1)}>←</button>
                  {Array.from({ length: data.totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`il-page-btn ${i === data.page ? "active" : ""}`}
                      onClick={() => goToPage(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button className="ghost-btn small" disabled={data.page >= data.totalPages - 1}
                    onClick={() => goToPage(data.page + 1)}>→</button>
                </div>
              )}
              <p className="hint il-total">Знайдено: {data.totalElements}</p>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function buildApiFileUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_URL || "";
  const originBase = apiBase.endsWith("/api")
    ? apiBase.slice(0, -4)
    : apiBase.replace(/\/$/, "");

  return `${originBase}${url.startsWith("/") ? url : `/${url}`}`;
}

function initialsOf(c) {
  const f = c.name ? c.name.trim()[0] : "";
  const l = c.lastName ? c.lastName.trim()[0] : "";
  return (f + l).toUpperCase() || "?";
}

function experienceLabel(years) {
  if (years == null) return "";
  if (years <= 0) return "Початківець";
  if (years >= 5) return "Більше 5 років";
  if (years >= 3) return "Більше 3 років";
  if (years >= 2) return "Більше 2 років";
  return years + " рік(и)";
}
