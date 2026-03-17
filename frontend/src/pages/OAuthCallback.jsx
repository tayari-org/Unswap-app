import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * OAuthCallback — handles the redirect back from LinkedIn / X (Twitter) OAuth.
 *
 * The backend redirects here with:
 *   /oauth-callback?token=<JWT>&from=<returnUrl>
 * On error:
 *   /login?oauthError=<message>   (handled directly in Login.jsx)
 */
export default function OAuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { checkAppState } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const from = searchParams.get('from') || '/Dashboard';
        const errorMsg = searchParams.get('error');

        if (errorMsg) {
            navigate(`/login?oauthError=${encodeURIComponent(errorMsg)}`, { replace: true });
            return;
        }

        if (!token) {
            navigate('/login?oauthError=No+token+received+from+OAuth+provider', { replace: true });
            return;
        }

        // Store JWT and sync auth context
        localStorage.setItem('unswap_token', token);
        checkAppState().then(() => {
            navigate(from, { replace: true });
        }).catch(() => {
            navigate('/Dashboard', { replace: true });
        });
    }, []);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
            <p className="text-slate-400 text-sm font-medium tracking-wide">Completing sign-in…</p>
        </div>
    );
}
