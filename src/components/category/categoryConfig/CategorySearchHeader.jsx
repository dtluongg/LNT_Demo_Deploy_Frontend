import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../../contexts/ThemeContext";
import { getThemeStyles } from "../../../config/themeStyles";
import { searchContents } from "../../../api/contents";

// Props:
// - placeholder
// - modulesList: optional initial modules list
// - ensureModulesLoaded: async function to call to load modules if needed
// - onSelectCategory(category, module)
// - onSelectContent(category, module, contentId)
export default function CategorySearchHeader({ placeholder = "Search...", modulesList = [], ensureModulesLoaded, onSelectCategory, onSelectContent, onQueryChange }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [contentResults, setContentResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const modulesRef = useRef(modulesList);

  useEffect(() => {
    modulesRef.current = modulesList;
  }, [modulesList]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const buildResults = (q) => {
    if (!q) return [];
    const lower = q.toLowerCase();
    const out = [];
    modulesRef.current.forEach((m) => {
      const cats = Array.isArray(m.categories) ? m.categories : [];
      const mapById = {};
      cats.forEach((c) => { mapById[c.id] = c; });
      cats.forEach((c) => {
        const title = (c.title || c.name || c.label || "").toString().toLowerCase();
        if (title.includes(lower)) {
          const path = [];
          let cur = c;
          while (cur) {
            path.unshift(cur.title || cur.name || cur.label);
            const pid = cur.parent_id ?? cur.parentId ?? null;
            cur = pid && mapById[pid] ? mapById[pid] : null;
          }
          out.push({ module: m, category: c, path: path.join(" > ") });
        }
      });
    });
    return out;
  };

  const handleChange = (v) => {
    setQuery(v);
    if (onQueryChange) onQueryChange(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (v.trim().length === 0) {
        setResults([]);
        setContentResults([]);
        if (onQueryChange) onQueryChange("");
        return;
      }
      if (ensureModulesLoaded) {
        setLoading(true);
        try {
          await ensureModulesLoaded();
        } finally {
          setLoading(false);
        }
      }
      const res = buildResults(v.trim());
      setResults(res);

      // server-side content search
      try {
        setLoading(true);
        const resp = await searchContents(v.trim());
        const data = resp && resp.data && resp.data.data ? resp.data.data : [];
        const mapped = data.map((item) => {
          const catId = item.category_id ?? item.categoryId ?? null;
          const module = modulesRef.current.find((mm) => Array.isArray(mm.categories) && mm.categories.some((c) => c.id === catId));
          let path = item.category_title || "";
          if (module) {
            const cats = Array.isArray(module.categories) ? module.categories : [];
            const mapById = {};
            cats.forEach((c) => { mapById[c.id] = c; });
            const catObj = mapById[catId];
            if (catObj) {
              const parts = [];
              let cur = catObj;
              while (cur) {
                parts.unshift(cur.title || cur.name || cur.label);
                const pid = cur.parent_id ?? cur.parentId ?? null;
                cur = pid && mapById[pid] ? mapById[pid] : null;
              }
              path = parts.join(" > ");
            }
          }
          return { content: item, module, path, categoryId: catId };
        });
        setContentResults(mapped);
      } catch (err) {
        setContentResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleFocus = async () => {
    setOpen(true);
    if (ensureModulesLoaded && modulesRef.current.length === 0) {
      setLoading(true);
      try {
        await ensureModulesLoaded();
      } finally {
        setLoading(false);
      }
    }
  };

  // close on ESC or click outside
  const wrapperRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onDown = (ev) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(ev.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const handleSelect = (cat, mod) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setContentResults([]);
    if (onQueryChange) onQueryChange("");
    console.log('[CategorySearchHeader] handleSelect', { item: cat });
    if (onSelectCategory) onSelectCategory(cat, mod);
  };

  const handleSelectContent = (content, mod) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setContentResults([]);
    if (onQueryChange) onQueryChange("");
    const catId = content.category_id ?? content.categoryId ?? null;
    let catObj = null;
    if (mod && Array.isArray(mod.categories)) catObj = mod.categories.find((c) => c.id === catId) || null;
    console.log('[CategorySearchHeader] handleSelectContent', { contentId: content.id, categoryObj: catObj, moduleId: mod?.id });
    if (onSelectContent) onSelectContent(catObj, mod, content.id);
  };

  const { effective } = useTheme();
  const theme = getThemeStyles(effective);

  const inputClass = theme.headerSearchInputClass;
  const dropdownClass = theme.searchDropdownClass;
  const resultHover = theme.searchResultHover || 'hover:shadow-sm hover:bg-white';

  return (
    <div ref={wrapperRef} className={`${theme.headerSearchContainerClass} relative`}>
      <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${theme.headerSearchIconClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        aria-label="Search guides, modules or contents"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`${inputClass} pl-12`}
      />

      {open && (query || results.length > 0 || contentResults.length > 0 || loading) && (
        <div className={dropdownClass} style={{ animation: 'fadeIn 120ms ease-out' }}>
          {loading ? (
            <div className={`${theme.modalLoadingClass} p-2`}>Loading...</div>
          ) : null}

          {results.length > 0 && (
            <div>
              <div className={`text-sm mb-2 font-semibold ${theme.resultPathClass}`}>Categories <span className="text-xs text-gray-400">({results.length})</span></div>
              <ul className="space-y-3">
              {results.map((r, idx) => (
                <li key={`${r.module.id}-${r.category.id}-${idx}`} className={`flex items-center justify-between p-3 rounded-lg ${resultHover}`}>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium truncate">{r.category.title || r.category.name || r.category.label}</div>
                      <div className="inline-block text-xs text-white bg-blue-600 px-2 py-0.5 rounded-full">{r.module.name}</div>
                    </div>
                    <div className={`${theme.resultPathClass} truncate mt-1`}>{r.path}</div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button onClick={() => handleSelect(r.category, r.module)} className="text-sm px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Open</button>
                  </div>
                </li>
              ))}
              </ul>
            </div>
          )}

          {/* Content search results (from server) */}
          {!loading && contentResults && contentResults.length > 0 && (
            <div className="mt-3">
              <div className={`text-sm mb-2 font-semibold ${theme.resultPathClass}`}>Contents <span className="text-xs text-gray-400">({contentResults.length})</span></div>
              <ul className="space-y-3">
                {contentResults.map((r, idx) => (
                  <li key={`content-${r.content.id}-${idx}`} className={`p-3 rounded-lg ${resultHover}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.content.title}</div>
                        <div className={`${theme.resultPathClass} truncate`}>{r.path}</div>
                        <div className={`${theme.resultPathClass} mt-1`}>
                          <Snippet text={r.content.plain_content || r.content.plainContent || ''} q={query} />
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button onClick={() => handleSelectContent(r.content, r.module)} className="text-sm px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm">Open</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && results.length === 0 && contentResults.length === 0 && (
            <div className={`${theme.modalLoadingClass} p-2`}>No results</div>
          )}
        </div>
      )}
    </div>
  );
}

function escapeHtml(str) {
  return str.replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function Snippet({ text = '', q = '' }) {
  if (!text) return null;
  const lower = (text || '').toLowerCase();
  const needle = (q || '').toLowerCase();
  if (!needle) {
    const short = text.length > 140 ? text.slice(0, 140) + '...' : text;
    return <span>{short}</span>;
  }
  const idx = lower.indexOf(needle);
  if (idx === -1) {
    const short = text.length > 140 ? text.slice(0, 140) + '...' : text;
    return <span>{short}</span>;
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + needle.length + 80);
  const before = escapeHtml(text.slice(start, idx));
  const match = escapeHtml(text.slice(idx, idx + needle.length));
  const after = escapeHtml(text.slice(idx + needle.length, end));
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  const html = `${prefix}${before}<mark class="search-highlight">${match}</mark>${after}${suffix}`;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
