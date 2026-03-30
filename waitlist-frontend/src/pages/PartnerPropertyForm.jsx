import React, { useState } from 'react';

export default function PartnerPropertyForm() {
  const [form, setForm] = useState({
    owner_email: '',
    title: '',
    city: '',
    country: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Read backend URL from Vite environment, fallback to localhost
  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  // Read API Key from `.env`
  const API_KEY = import.meta.env.VITE_PARTNER_API_KEY;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!API_KEY) {
      setMessage('Error: VITE_PARTNER_API_KEY is not defined in the environment.');
      setLoading(false);
      return;
    }

    try {
      let photoUrls = [];

      // 1. UPLOAD ALL PHOTOS
      if (imageFiles && imageFiles.length > 0) {
        // Upload each file and await the results
        const uploadPromises = Array.from(imageFiles).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadRes = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: { 'x-api-key': API_KEY },
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Photo upload failed for ${file.name}`);
          }
          
          const uploadData = await uploadRes.json();
          return uploadData.file_url;
        });
        
        // Wait for all uploads to complete
        photoUrls = await Promise.all(uploadPromises);
      }

      // 2. SUBMIT PROPERTY DATA
      const propertyRes = await fetch(`${API_URL}/api/entities/Property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          owner_email: form.owner_email,
          title: form.title,
          city: form.city,
          country: form.country,
          status: 'active',
          photos: photoUrls,
        }),
      });

      if (!propertyRes.ok) {
        const errData = await propertyRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit property');
      }

      const createdProperty = await propertyRes.json();
      setMessage('Success: Property added successfully!');
      console.log('Created property:', createdProperty);

      // Reset form
      setForm({ owner_email: '', title: '', city: '', country: '' });
      setImageFiles([]);
      // Reset file input in DOM
      document.getElementById('partner-photo-upload').value = null;
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">Partner Submission</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Submit a new property via the API integration.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="owner_email" className="block text-sm font-medium text-gray-700">Owner Email</label>
              <input
                id="owner_email"
                name="owner_email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="owner@example.com"
                value={form.owner_email}
                onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Property Title</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Cozy Apartment in Nairobi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Nairobi"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Kenya"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="partner-photo-upload" className="block text-sm font-medium text-gray-700">Property Photos (Optional)</label>
              <input
                id="partner-photo-upload"
                name="photos"
                type="file"
                multiple
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => setImageFiles(e.target.files)}
              />
              {imageFiles.length > 0 && (
                 <p className="mt-2 text-xs text-gray-500">{imageFiles.length} file(s) selected</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : 'Submit Property'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-md text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
