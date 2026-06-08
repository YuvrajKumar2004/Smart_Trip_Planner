import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function OAuth2RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useAuthStore();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        console.log("FULL URL:", window.location.href);

        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userId = params.get('userId');

        console.log("accessToken:", accessToken);
        console.log("refreshToken:", refreshToken);
        console.log("userId:", userId);
        console.log("All params:", Object.fromEntries(params.entries()));
        const name = params.get('name');
        const email = params.get('email');
        const role = params.get('role');

        if (accessToken && refreshToken && userId) {
            const user = {
                id: userId,
                name: name ? decodeURIComponent(name) : '',
                email: email ? decodeURIComponent(email) : '',
                role: role || 'USER'
            };

            setAuth(accessToken, refreshToken, user);
            toast.success('Successfully logged in!');
            navigate('/explore', { replace: true });
        } else {
            toast.error('OAuth login failed.');
            navigate('/login', { replace: true });
        }
    }, [location, navigate, setAuth]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div className="spinner"></div>
            <span style={{ marginLeft: '10px' }}>Authenticating...</span>
        </div>
    );
}
