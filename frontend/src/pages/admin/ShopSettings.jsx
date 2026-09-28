import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { supabase } from '../../lib/supabaseClient.js';
import { Store, Video, Upload, Trash2 } from 'lucide-react';

const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_MB = 50;

export default function ShopSettings() {
  const [form, setForm] = useState({ shop_name: '', address: '', phone: '', logo_url: '', owner_photo_url: '' });
  const [msg, setMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoMsg, setVideoMsg] = useState('');
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    api('/settings').then((s) => {
      setForm(s);
      setVideoUrl(s.guide_video_url || '');
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    await api('/settings', { method: 'PUT', body: form });
    setMsg('Shop details saved.');
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    setVideoError(''); setVideoMsg('');
    if (!file) return;

    if (!ALLOWED_VIDEO.includes(file.type)) {
      setVideoError('Please choose an MP4, WebM, or MOV video.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setVideoError(`Video is larger than ${MAX_MB} MB. Please compress it first.`);
      return;
    }

    setVideoBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BASE}/api/settings/guide-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Video upload failed');
      }
      const data = await res.json();
      setVideoUrl(data.guide_video_url);
      setVideoMsg('Video uploaded. It now shows on the Help page.');
    } catch (err) {
      setVideoError(err.message);
    }
    setVideoBusy(false);
  };

  const removeVideo = async () => {
    if (!window.confirm('Remove the guide video?')) return;
    setVideoError(''); setVideoMsg('');
    try {
      await api('/settings/guide-video', { method: 'DELETE' });
      setVideoUrl('');
      setVideoMsg('Video removed.');
    } catch (err) {
      setVideoError(err.message);
    }
  };

  const inputClass = "w-full bg-ivory rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h2 className="text-xl font-serif font-bold text-ink mb-4 flex items-center gap-2">
        <Store size={20} /> Shop Details
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Shop Name</label>
          <input placeholder="Shop name" value={form.shop_name} onChange={set('shop_name')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Address</label>
          <textarea placeholder="Address" value={form.address} onChange={set('address')} className={inputClass + " min-h-[80px]"} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Phone</label>
          <input placeholder="Phone" value={form.phone} onChange={set('phone')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Logo URL</label>
          <input placeholder="Logo URL" value={form.logo_url} onChange={set('logo_url')} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-ink/50 mb-1 block">Owner Photo URL (shown on homepage banner)</label>
          <input placeholder="https://..." value={form.owner_photo_url} onChange={set('owner_photo_url')} className={inputClass} />
        </div>

        <button onClick={save} className="w-full bg-brand text-white font-semibold py-2.5 rounded-full hover:bg-brand-dark transition-colors">
          Save
        </button>
        {msg && <p className="text-green-700 text-sm">{msg}</p>}
      </div>

      {/* Guide video */}
      <h2 className="text-xl font-serif font-bold text-ink mt-8 mb-4 flex items-center gap-2">
        <Video size={20} /> How-to-Order Guide Video
      </h2>

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <p className="text-xs text-ink/50">
          Shown at the top of the Help page. MP4 recommended, up to {MAX_MB} MB. Uploading a new video replaces the old one.
        </p>

        {videoUrl && (
          <video src={videoUrl} controls playsInline preload="metadata" className="w-full rounded-xl bg-black" />
        )}

        <input id="guide-video-input" type="file" accept="video/mp4,video/webm,video/quicktime"
               onChange={handleVideoSelect} style={{ display: 'none' }} />

        <div className="flex gap-2">
          <button
            type="button"
            disabled={videoBusy}
            onClick={() => document.getElementById('guide-video-input').click()}
            className="flex items-center gap-2 bg-ivory text-ink font-medium text-sm px-4 py-2.5 rounded-xl hover:shadow-sm transition-shadow disabled:opacity-50"
          >
            <Upload size={16} /> {videoBusy ? 'Uploading… please wait' : videoUrl ? 'Replace Video' : 'Upload Video'}
          </button>
          {videoUrl && !videoBusy && (
            <button type="button" onClick={removeVideo}
                    className="flex items-center gap-2 text-red-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-red-50">
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>

        {videoError && <p className="text-red-600 text-sm">{videoError}</p>}
        {videoMsg && <p className="text-green-700 text-sm">{videoMsg}</p>}
      </div>
    </div>
  );
}