import React, { useState } from "react";
import Header from "../components/Header";
import CategoryContainer from "../components/category/CategoryContainer";
import ContentContainer from "../components/content/ContentContainer";
import { useTheme } from "../contexts/ThemeContext";
import { getThemeStyles } from "../config/themeStyles";

export default function HomePage({ user }) {
  const [activeModule, setActiveModule] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [titleCategory, setTitleCategory] = useState("");
  const [scrollToContentId, setScrollToContentId] = useState(null);
  const { effective } = useTheme();
  const theme = getThemeStyles(effective);

  const handleHeaderSelectCategory = (catOrId, mod, contentId) => {
    if (mod) setActiveModule(mod);
    const id = typeof catOrId === "object" ? Number(catOrId.id) : Number(catOrId);
    setActiveCategory(id);
    if (typeof catOrId === "object") {
      setTitleCategory(catOrId.title || catOrId.name || "");
    }
    if (contentId) {
      console.log('[HomePage] header select contentId', contentId, 'categoryId', id, 'module', mod?.id);
      setScrollToContentId(Number(contentId));
    }
  };

  const handleHeaderSelectModule = (m) => setActiveModule(m);

  // NOTE: `handleOpenContent` removed — use `handleHeaderSelectCategory` which
  // sets `scrollToContentId` so ContentContainer can open and scroll.

  return (
    <div className={`h-screen flex flex-col ${theme.pageBgClass}`}>
      <Header user={user} onSelectModule={handleHeaderSelectModule} onSelectCategory={handleHeaderSelectCategory} />
      <div className="flex flex-1 overflow-hidden">
        {activeModule ? (
          <>
            <CategoryContainer
              moduleId={activeModule?.id}
              onSelectCategory={setActiveCategory}
              selectedCategoryId={activeCategory}
              nameModuleSelected={activeModule?.name}
              iconModuleSelected={activeModule?.icon}
              userRole={user.role}
              titleCategorySelected={setTitleCategory}
            />

            <ContentContainer
              categoryId={activeCategory}
              moduleId={activeModule?.id}
              titleCategory={titleCategory}
              userRole={user.role}
              scrollToContentId={scrollToContentId}
              onScrolledToContent={() => setScrollToContentId(null)}
            />
          </>
        ) : (


          <div className="flex-1 flex items-center justify-center p-8">
            {/** use theme-driven welcome card styles */}
            <WelcomeCard />
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeCard() {
  const { effective } = useTheme();
  const theme = getThemeStyles(effective);
  return (
    <div className={theme.welcomeCardClass}>
      <div className={theme.welcomeAccentClass} style={{ width: 56, height: 56 }}>
        <img src="/lntlogo.png" alt="LNT" className="w-10 h-10 object-contain" />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-[360px] w-full">
            <img src="/LNTlogo_horizontal_color.png" alt="LNT logo" className="w-full h-auto object-contain" />
            <p className={`${theme.welcomeTextClass} mt-2`}>A quick reference for company guides and modules</p>
          </div>
        </div>

        <div className="flex-1">
          <h2 className={`${theme.welcomeTitleClass} mb-2`}>Welcome to App Guide</h2>
          <p className={`${theme.welcomeTextClass} mb-4`}>Select a module to view categories and guides. Use search for quick access to contents.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openModulesModal'))}
              className={theme.welcomeBtnClass}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor" opacity="0.85"/><rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor" opacity="0.7"/><rect x="13" y="13" width="8" height="8" rx="1" fill="currentColor" opacity="0.55"/></svg>
              Open modules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
