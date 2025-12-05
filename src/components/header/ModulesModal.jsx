import React, { useState, useEffect } from "react";
import { buildCategoryTree } from "../category/categoryConfig/categoryHelper";
import { useTheme } from "../../contexts/ThemeContext";
import { getThemeStyles } from "../../config/themeStyles";

export default function ModulesModal({ open, onClose, modulesList, loadingModules, modulesError, onSelectCategory }) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const { effective } = useTheme();
  const theme = getThemeStyles(effective);
  const [headerOffset, setHeaderOffset] = useState(64);

  useEffect(() => {
    const calc = () => {
      try {
        const hdr = document.querySelector('header');
        const h = hdr ? Math.max(56, Math.round(hdr.getBoundingClientRect().height)) : 64;
        setHeaderOffset(h);
      } catch (err) {
        setHeaderOffset(64);
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const renderCategoryNode = (node, module, level = 0) => {
    const padding = { paddingLeft: `${level * 12}px` };
    const isExpanded = expandedIds.has(node.id);
    return (
      <li key={node.id} className="relative">
        <div className="flex items-center justify-between" style={padding}>
          <button
            onClick={() => onSelectCategory && onSelectCategory(node, module)}
            className={`text-left w-full px-2 py-1 rounded-md ${theme.hoverNodeBg} transition`}
          >
            <span className="truncate">{node.title || node.name || node.label}</span>
          </button>

          {node.children && node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedIds((prev) => {
                  const s = new Set(prev);
                  if (s.has(node.id)) s.delete(node.id);
                  else s.add(node.id);
                  return s;
                });
              }}
              aria-expanded={isExpanded}
              className={`ml-2 ${theme.arrowClass} transform transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              ▸
            </button>
          )}
        </div>

        {node.children && node.children.length > 0 && isExpanded && (
          <ul className="mt-1 space-y-1">
            {node.children.map((ch) => renderCategoryNode(ch, module, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50 flex items-start justify-center" style={{ top: headerOffset + 'px', padding: 24 }}>
      <div className="absolute left-0 right-0 bottom-0" style={{ top: headerOffset + 'px', background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div className={theme.modalContainerClass} style={{ maxHeight: `calc(100vh - ${headerOffset + 48}px)` }}>
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-lg font-semibold">All Modules</h3>
          <div className="flex items-center gap-3">
            {loadingModules && <div className={theme.modalLoadingClass}>Loading...</div>}
            <button onClick={onClose} className={`${theme.modalCloseBtn} rounded-md flex items-center gap-2`} aria-label="Close modules">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {modulesError && <div className="text-red-400 mb-3">{modulesError}</div>}

          <div className="mb-4">
            {/* simple search box is in header TopBar; modal keeps full modules view */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modulesList.map((m) => {
              const cats = Array.isArray(m.categories) ? m.categories : [];
              const roots = buildCategoryTree(cats);
              return (
                <div key={m.id} className={theme.moduleCardClass}>
                  <div className="mb-3">
                    <div className="inline-block px-3 py-1 rounded-md bg-gradient-to-r from-blue-600/70 to-indigo-600/60 text-white font-semibold text-sm shadow-sm">
                      {m.name}
                    </div>
                    {m.description && <div className={theme.moduleDescClass}>{m.description}</div>}
                  </div>

                  <div className="text-sm">
                    {roots && roots.length ? (
                      <ul className="space-y-1">{roots.map((c) => renderCategoryNode(c, m, 0))}</ul>
                    ) : (
                      <div className={theme.noTopClass}>No top-level categories</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
