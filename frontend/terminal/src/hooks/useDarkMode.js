import { useState, useEffect } from 'react';

export const useDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') || 
               window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark') || mediaQuery.matches);
        };

        // Listen for changes in the DOM class
        const observer = new MutationObserver(handleChange);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Listen for system theme changes
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return isDarkMode;
};
