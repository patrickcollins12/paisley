import { createContext, useContext, useEffect, useState } from "react";

const initialState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Function to apply the system theme class
      const applySystemTheme = (matches) => {
        const systemTheme = matches ? "dark" : "light";
        root.classList.add(systemTheme);
      }

      // Initial check
      applySystemTheme(mediaQuery.matches);

      // Listener for changes
      const handleChange = (e) => {
        // Only apply if the component's theme is still 'system'
        // This check might be implicitly handled by the effect cleanup,
        // but adding it explicitly ensures correctness if the theme changes
        // while the listener is technically still attached before cleanup.
        if (theme === "system") { 
           root.classList.remove("light", "dark"); // Remove old class before adding new
           applySystemTheme(e.matches);
        }
      };

      mediaQuery.addEventListener("change", handleChange);

      // Cleanup function to remove listener when theme changes or component unmounts
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };

    } else {
      // Apply the explicitly set theme (light or dark)
      root.classList.add(theme);
    }
  // Rerun effect if the theme state changes
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

export const useResolvedTheme = () => {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (theme !== 'system') {
      return theme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      // Initial check in case the preference changed between initial state and effect run
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light'); 
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  return resolvedTheme;
};