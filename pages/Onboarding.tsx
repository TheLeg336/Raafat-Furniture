import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, ArrowRight } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { user, firstName, lastName, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (!loading && firstName && lastName) {
      navigate('/');
    }
  }, [user, firstName, lastName, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !lName.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await updateProfile(fName.trim(), lName.trim());
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] opacity-10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[var(--color-primary)] opacity-10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-2xl border border-white/10 px-10 py-12 rounded-3xl shadow-2xl max-w-md w-full text-center relative z-10"
      >
        <div className="w-16 h-16 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-primary)]/20">
          <UserIcon size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
          Complete Your Profile
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Please enter your name to personalize your experience.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-[var(--color-secondary)]/30 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-[var(--color-text-primary)] transition-all"
              placeholder="First Name"
            />
          </div>
          <div>
            <input
              type="text"
              required
              value={lName}
              onChange={(e) => setLName(e.target.value)}
              className="w-full px-4 py-3 bg-transparent border border-[var(--color-secondary)]/30 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-[var(--color-text-primary)] transition-all"
              placeholder="Last Name"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Continue <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
