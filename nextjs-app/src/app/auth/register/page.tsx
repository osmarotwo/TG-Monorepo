'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '@/lib/api';
import LanguageSelector from '@/components/LanguageSelector';
import { useLocale } from '@/contexts/LocaleContext';
import { Logo } from '@/components/Logo';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google';
const GOOGLE_SCOPE = 'openid email profile';
const GOOGLE_STATE = 'google_auth';

const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SCOPE)}&state=${GOOGLE_STATE}`;

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordMismatch', 'auth'));
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t('passwordTooShort', 'validation'));
      setLoading(false);
      return;
    }

    try {
      const result = await apiService.register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate || undefined,
        gender: formData.gender || undefined
      });

      if (result.success) {
        setSuccess(true);
        // Optionally redirect after a delay
        setTimeout(() => {
          router.push('/auth/login?message=registration-success');
        }, 3000);
      } else {
        setError(result.error || t('errors.generic'));
      }
    } catch {
      setError(t('connectionError', 'auth'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
        {/* Language Selector - Fixed position */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        
        <div className="max-w-md w-full">
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {t('registrationSuccess', 'auth')}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {t('registrationSuccessMessage', 'auth')}{' '}
              <span className="font-medium text-[#13a4ec]">{formData.email}</span>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>{t('important', 'common')}:</strong> {t('checkEmailMessage', 'auth')}
              </p>
            </div>
            
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] transition-colors"
            >
              {t('goToLogin', 'auth')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="max-w-md w-full">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('createAccount', 'auth')}
            </h1>
            <p className="text-gray-600">
              {t('joinOurPlatform', 'auth')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                {t('fullName', 'auth')}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t('fullNamePlaceholder', 'auth')}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('email', 'auth')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t('emailPlaceholder', 'auth')}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('password', 'auth')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t('passwordPlaceholder', 'auth')}
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('passwordMinLength', 'auth')}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirmPassword', 'auth')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                placeholder={t('confirmPasswordPlaceholder', 'auth')}
              />
            </div>

            {/* Birth Date Field */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('birthDate', 'auth')}
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
                max={new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('minAge13', 'auth')}
              </p>
            </div>

            {/* Gender Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('gender', 'auth')}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
                  />
                  <span className="text-gray-700">{t('male', 'auth')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
                  />
                  <span className="text-gray-700">{t('female', 'auth')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="prefer-not-to-say"
                    checked={formData.gender === 'prefer-not-to-say'}
                    onChange={handleChange}
                    className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
                  />
                  <span className="text-gray-700">{t('preferNotToSay', 'auth')}</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('creatingAccount', 'auth')}
                </div>
              ) : (
                t('createAccount', 'auth')
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/50 text-gray-500">{t('orSignUpWith', 'auth')}</span>
              </div>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              onClick={() => window.location.href = googleAuthUrl}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('registerWithGoogle', 'auth')}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('alreadyHaveAccount', 'auth')}{' '}
              <Link href="/auth/login" className="text-[#13a4ec] hover:text-[#0f8fcd] font-medium">
                {t('signIn', 'auth')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}