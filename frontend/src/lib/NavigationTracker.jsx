import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '@/api/apiClient';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );
            pageName = matchedKey || null;
        }

        if (isAuthenticated && pageName) {
            // Log page visit to our own ActivityLog entity (replaces api.appLogs)
            api.entities.ActivityLog.create({
                activity_type: 'page_view',
                description: `User visited ${pageName}`,
                is_public: false,
            }).catch(() => {
                // Silently fail — logging should never break navigation
            });
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}