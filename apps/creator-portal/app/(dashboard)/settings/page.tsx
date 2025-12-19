'use client';

import { useState } from 'react';
import { User, Mail, Phone, MapPin, Instagram, Youtube, Twitter, Camera } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    fullName: 'John Creator',
    email: 'john@creator.com',
    phone: '+1 (555) 123-4567',
    location: 'Los Angeles, CA',
    bio: 'Fashion and lifestyle creator passionate about sustainable fashion',
    niche: 'fashion',
    instagram: '@johncreator',
    youtube: '@johncreator',
    twitter: '@johncreator',
    tiktok: '@johncreator',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic here
    alert('Settings saved!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Profile Photo</h3>
            <p className="text-sm text-gray-600 mb-2">
              Upload a professional photo for your profile
            </p>
            <button className="btn btn-outline text-sm">
              Change Photo
            </button>
          </div>
        </div>

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
                  className="input pl-10"
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
                  className="input pl-10"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  className="input pl-10"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="location"
                  type="text"
                  className="input pl-10"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="input"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
              Content Niche
            </label>
            <select
              id="niche"
              className="input"
              value={formData.niche}
              onChange={(e) =>
                setFormData({ ...formData, niche: e.target.value })
              }
            >
              <option value="fashion">Fashion & Beauty</option>
              <option value="fitness">Fitness & Health</option>
              <option value="food">Food & Cooking</option>
              <option value="tech">Technology</option>
              <option value="travel">Travel</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="gaming">Gaming</option>
              <option value="education">Education</option>
            </select>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-4">Social Media Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="instagram"
                    type="text"
                    className="input pl-10"
                    placeholder="@username"
                    value={formData.instagram}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube
                </label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="youtube"
                    type="text"
                    className="input pl-10"
                    placeholder="@channel"
                    value={formData.youtube}
                    onChange={(e) =>
                      setFormData({ ...formData, youtube: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter/X
                </label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="twitter"
                    type="text"
                    className="input pl-10"
                    placeholder="@username"
                    value={formData.twitter}
                    onChange={(e) =>
                      setFormData({ ...formData, twitter: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tiktok" className="block text-sm font-medium text-gray-700 mb-1">
                  TikTok
                </label>
                <input
                  id="tiktok"
                  type="text"
                  className="input"
                  placeholder="@username"
                  value={formData.tiktok}
                  onChange={(e) =>
                    setFormData({ ...formData, tiktok: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
            <button type="button" className="btn btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Password & Security</h2>
        <div className="space-y-4">
          <button className="btn btn-outline w-full text-left">
            Change Password
          </button>
          <button className="btn btn-outline w-full text-left">
            Enable Two-Factor Authentication
          </button>
          <button className="btn btn-outline w-full text-left">
            Manage Connected Devices
          </button>
        </div>
      </div>

      <div className="card border-red-200">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="btn bg-red-600 text-white hover:bg-red-700">
          Delete Account
        </button>
      </div>
    </div>
  );
}
