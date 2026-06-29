import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileVideo, Lock, Store, ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceAfn, setPriceAfn] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isApprovedSeller = user?.isApproved || user?.isSeller || user?.isAdmin;

  if (!isApprovedSeller) {
    return <SellerApplication />;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const totalSize = selected.reduce((sum, f) => sum + f.size, 0);
    const existingSize = files.reduce((sum, f) => sum + f.size, 0);

    if (totalSize + existingSize > 120 * 1024 * 1024) {
      toast.error('Total file size exceeds 120MB limit');
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !priceAfn) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('priceAFN', priceAfn);
      formData.append('priceUSD', priceUsd || String(Math.round(parseFloat(priceAfn) / 87)));

      if (files.length > 0) {
        formData.append('media', files[0]);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + Math.random() * 20, 90));
      }, 300);

      await api.createPost(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success('Post created successfully!');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1E] px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => navigate('/')} className="text-[#8E8E93] text-[15px]">Cancel</button>
        <h1 className="text-[17px] font-semibold text-[#1C1C1E] dark:text-white">Create Post</h1>
        <div className="w-12" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
        {/* Media Upload */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#007AFF] rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer active:bg-blue-50 dark:active:bg-blue-900/20 transition-colors"
          >
            <Upload size={28} className="text-[#007AFF] mb-2" />
            <p className="text-[14px] text-[#007AFF] font-medium">Tap to Add Photos/Videos</p>
            <p className="text-[11px] text-[#8E8E93] mt-1">Max 120MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Thumbnails */}
          {files.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {files.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  {file.type.startsWith('video/') ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <FileVideo size={20} className="text-white" />
                    </div>
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-3">
              <div className="h-2 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#007AFF] rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[12px] text-[#8E8E93] mt-1 text-center">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl px-4 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
            required
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <textarea
            placeholder="Description / Info *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-28 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF] resize-none"
            required
          />
        </div>

        {/* Prices */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007AFF] font-bold text-[16px]">AFN</span>
            <input
              type="number"
              placeholder="Price in AFN *"
              value={priceAfn}
              onChange={(e) => setPriceAfn(e.target.value)}
              className="w-full h-12 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl pl-16 pr-4 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              required
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] font-bold text-[16px]">$</span>
            <input
              type="number"
              placeholder="Price in USD (optional)"
              value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)}
              className="w-full h-12 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl pl-10 pr-4 text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || !title.trim() || !description.trim() || !priceAfn}
          className="w-full h-12 bg-[#007AFF] text-white font-semibold text-[16px] rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {uploading ? 'Posting...' : 'Post Ad'}
        </button>
      </form>
    </div>
  );
}

// Seller Application Screen
function SellerApplication() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !description.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      setSubmitting(true);
      await api.applySeller({ businessName: businessName.trim(), description: description.trim(), phone: phone.trim() });
      setSubmitted(true);
      toast.success('Application submitted!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-full bg-[#F2F2F7] dark:bg-black flex flex-col items-center justify-center px-6">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-8 text-center w-full max-w-sm">
          <div className="w-16 h-16 bg-[#34C759]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-[#34C759]" />
          </div>
          <h2 className="text-[20px] font-bold text-[#1C1C1E] dark:text-white mb-2">Application Submitted!</h2>
          <p className="text-[14px] text-[#8E8E93] mb-6">Our team will review your request and get back to you soon.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full h-12 bg-[#007AFF] text-white font-semibold rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F2F2F7] dark:bg-black flex flex-col items-center justify-center px-6">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-sm">
        <div className="w-14 h-14 bg-[#007AFF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-[#007AFF]" />
        </div>
        <h2 className="text-[20px] font-bold text-[#1C1C1E] dark:text-white text-center mb-1">Create Post</h2>
        <p className="text-[14px] text-[#8E8E93] text-center mb-6">
          Only approved sellers can create posts on Kabul Bazar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Business Name *"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
              required
            />
          </div>
          <textarea
            placeholder="Business Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-24 p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF] resize-none"
            required
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-12 px-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl text-[15px] text-[#1C1C1E] dark:text-white placeholder:text-[#8E8E93] outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#007AFF] text-white font-semibold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Apply to Become Seller'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-[14px] text-[#8E8E93] mt-4 py-2"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}
