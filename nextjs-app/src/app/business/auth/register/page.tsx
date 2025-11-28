'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '@/lib/api';
import LanguageSelector from '@/components/LanguageSelector';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { useLocale } from '@/contexts/LocaleContext';
import { Logo } from '@/components/Logo';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = 'http://localhost:3000/business/auth/google';
const GOOGLE_SCOPE = 'openid email profile';
const GOOGLE_STATE = 'business_google_auth';

const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SCOPE)}&state=${GOOGLE_STATE}`;

export default function BusinessRegisterPage() {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { t } = useLocale();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!formData.businessName || !formData.businessType) {
      setError('Please fill in all business information');
      setLoading(false);
      return;
    }

    try {
      const result = await apiService.register({
        fullName: formData.ownerName,
        email: formData.email,
        password: formData.password,
        profileType: 'business',
        businessName: formData.businessName,
        businessType: formData.businessType
      });

      if (result.success) {
        setSuccess(true);
        // Redirect to business login
        setTimeout(() => {
          router.push('/business/auth/login?message=registration-success');
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
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('success', 'common')}!
            </h2>
            <p className="text-gray-600 mb-6">
              {t('registrationSuccess', 'auth')}
            </p>
            <p className="text-sm text-gray-500">
              {t('redirectingToLogin', 'auth')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4 py-8">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white/50 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-6">
            <Logo size="lg" className="mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('business.auth.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {t('business.auth.joinOurPlatform')}
            </p>
          </div>

          {/* Google Sign Up Button */}
          <div className="mb-6">
            <GoogleAuthButton profileType="business" />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/50 text-gray-500">
                {t('or', 'auth')}
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Business Information Section */}
            <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Business Information
              </h3>
              
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('business.auth.businessName')} *
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] px-4 py-3 text-base"
                  placeholder={t('business.auth.businessNamePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('business.auth.businessType')} *
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={formData.businessType}
                  onChange={handleChange}
                  className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] px-4 py-3 text-base"
                >
                  <option value="">{t('business.auth.businessTypePlaceholder')}</option>
                  <option value="salon">{t('business.auth.businessTypes.salon')}</option>
                  <option value="spa">{t('business.auth.businessTypes.spa')}</option>
                  <option value="clinic">{t('business.auth.businessTypes.clinic')}</option>
                  <option value="gym">{t('business.auth.businessTypes.gym')}</option>
                  <option value="restaurant">{t('business.auth.businessTypes.restaurant')}</option>
                  <option value="other">{t('business.auth.businessTypes.other')}</option>
                </select>
              </div>
            </div>

            {/* Owner Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">
                Owner Information
              </h3>

              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('business.auth.ownerName')} *
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] px-4 py-3 text-base"
                  placeholder={t('business.auth.ownerNamePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email', 'auth')} *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] px-4 py-3 text-base"
                  placeholder={t('emailPlaceholder', 'auth')}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password', 'auth')} *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] px-4 py-3 text-base"
                  placeholder={t('passwordPlaceholder', 'auth')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('passwordMinLength', 'auth')}
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('confirmPassword', 'auth')} *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input w-full rounded-lg bg-[#f6f7f8] border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[#13a4ec] focus:border-[#13a4ec] px-4 py-3 text-base"
                  placeholder={t('confirmPasswordPlaceholder', 'auth')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-base sm:text-sm font-medium text-white bg-[#13a4ec] hover:bg-[#13a4ec]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13a4ec] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('loading', 'common')}
                </div>
              ) : (
                t('business.auth.createBusinessAccount')
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            {t('business.auth.alreadyHaveBusinessAccount')}{' '}
            <Link
              href="/business/auth/login"
              className="text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
            >
              {t('signIn', 'auth')}
            </Link>
          </p>

          {/* Back to Customer Portal */}
          <p className="mt-4 text-center text-xs text-gray-500">
            <Link
              href="/auth/register"
              className="hover:text-[#13a4ec]"
            >
              ← Customer registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
