'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, ArrowRight, Instagram, Youtube, Twitter } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    niche: '',
    socialHandle: '',
    platform: 'instagram',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        niche: formData.niche,
        socialHandle: formData.socialHandle,
        platform: formData.platform,
      });
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="card animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Join NEXUS
        </h2>
        <p className="text-gray-600 mb-6">
          Start creating and earning with top brands
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  required
                  className="input pl-10"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="input pl-10"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
              Content Niche
            </label>
            <select
              id="niche"
              required
              className="input"
              value={formData.niche}
              onChange={(e) =>
                setFormData({ ...formData, niche: e.target.value })
              }
            >
              <option value="">Select your niche</option>
              <option value="fashion">Fashion & Beauty</option>
              <option value="fitness">Fitness & Health</option>
              <option value="food">Food & Cooking</option>
              <option value="tech">Technology</option>
              <option value="travel">Travel</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="gaming">Gaming</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Platform
              </label>
              <select
                id="platform"
                required
                className="input"
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
              >
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>

            <div>
              <label htmlFor="socialHandle" className="block text-sm font-medium text-gray-700 mb-1">
                Social Handle
              </label>
              <input
                id="socialHandle"
                type="text"
                required
                className="input"
                placeholder="@username"
                value={formData.socialHandle}
                onChange={(e) =>
                  setFormData({ ...formData, socialHandle: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
            />
            <label className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              'Creating account...'
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
