import { authFetch } from './http';

export const registerRequest = ({ name, email, password }) =>
    authFetch('/api/auth/register', { method: 'POST', body: { name, email, password } });

export const loginRequest = ({ email, password }) =>
    authFetch('/api/auth/login', { method: 'POST', body: { email, password } });

export const getMeRequest = (token) => authFetch('/api/auth/me', { token });

export const verifyEmailRequest = (token) =>
    authFetch('/api/auth/verify-email', { method: 'POST', body: { token } });

export const resendVerificationRequest = (email) =>
    authFetch('/api/auth/resend-verification', { method: 'POST', body: { email } });

export const forgotPasswordRequest = (email) =>
    authFetch('/api/auth/forgot-password', { method: 'POST', body: { email } });

export const resetPasswordRequest = ({ token, password }) =>
    authFetch('/api/auth/reset-password', { method: 'POST', body: { token, password } });

export const updateProfileRequest = ({ profile, token }) =>
    authFetch('/api/auth/me', { method: 'PATCH', body: profile, token });

export const changePasswordRequest = ({ currentPassword, newPassword, token }) =>
    authFetch('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword }, token });
