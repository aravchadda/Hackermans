import { useState, useEffect } from 'react';

export const useDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check for both 'dark' class and 'light' class to be more accurate
        const hasDarkClass = document.documentElement.classList.contains('dark');
        const hasLightClass = document.documentElement.classList.contains('light');
        
        if (hasDarkClass) return true;
        if (hasLightClass) return false;
        
        // Fallback to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark');
            const hasLightClass = document.documentElement.classList.contains('light');
            
            if (hasDarkClass) {
                setIsDarkMode(true);
            } else if (hasLightClass) {
                setIsDarkMode(false);
            } else {
                // Fallback to system preference
                setIsDarkMode(mediaQuery.matches);
            }
        };

        // Listen for changes in the DOM class with more specific observation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    handleChange();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Listen for system theme changes
        mediaQuery.addEventListener('change', handleChange);

        // Initial check
        handleChange();

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return isDarkMode;
};
