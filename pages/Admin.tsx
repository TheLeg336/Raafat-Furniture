import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { differenceInDays, parseISO } from 'date-fns';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Archive, Folder, LogOut, Image as ImageIcon, X, RefreshCw, Activity, Home, Beaker, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GoogleGenAI, Type } from '@google/genai';
import { useCategories } from '../hooks/useCategories';
import { Edit, PlusCircle } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { LanguageOption, type TFunction, LocalizedString } from '../types';

const TEST_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80'
];

// Safety limit to prevent exceeding Firebase Spark free tier limits
const MAX_LISTINGS = 100;

interface AdminProps {
  t: TFunction;
  language: LanguageOption;
}

const Admin: React.FC<AdminProps> = ({ t, language }) => {
  const { user, isAdmin, isDeveloper, loading, logout, firstName, lastName } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = (searchParams.get('tab') as 'categories' | 'archive' | 'logs') || 'categories';
  const selectedCategory = searchParams.get('category');

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const setSelectedCategory = (category: string | null) => {
    if (category) {
      setSearchParams({ tab: 'categories', category });
    } else {
      setSearchParams({ tab: 'categories' });
    }
  };

  const { categories } = useCategories();
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<LocalizedString>({ en: '', ar: '' });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [newCategoryNames, setNewCategoryNames] = useState<string[]>(['']);
  const [listingsToRedistribute, setListingsToRedistribute] = useState<any[]>([]);
  const [redistributionMap, setRedistributionMap] = useState<Record<string, string>>({});

  const [listings, setListings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<any | null>(null);

  // Archived Tab State
  const [selectedArchivedCategory, setSelectedArchivedCategory] = useState<string | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isTestListing, setIsTestListing] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');

  useEffect(() => {
    if (!db || !isAdmin) return;
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(allProducts);
      },
      (error) => {
        console.error("Error fetching products:", error);
      }
    );

    let unsubscribeLogs = () => {};
    if (isDeveloper) {
      unsubscribeLogs = onSnapshot(
        collection(db, 'admin_logs'),
        (snapshot) => {
          const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(allLogs);
        },
        (error) => {
          console.error("Error fetching admin logs:", error);
        }
      );
    }

    // Fetch user profiles for logs
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const profiles: Record<string, any> = {};
        snapshot.docs.forEach(doc => {
          if (doc.id !== 'all_users_list') {
            profiles[doc.data().email] = doc.data();
          }
        });
        setUserProfiles(profiles);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeLogs();
      unsubscribeUsers();
    };
  }, [isAdmin, isDeveloper]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] p-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-[var(--color-text-primary)]">{t('admin_access_denied')}</h1>
          <p className="text-[var(--color-text-secondary)] mb-8">{t('admin_not_authorized').replace('{email}', user.email || '')}</p>
          <button 
            onClick={logout}
            className="w-full py-3 px-4 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {t('account_signout')}
          </button>
        </div>
      </div>
    );
  }

  const activeListings = listings.filter(l => !l.archivedAt);
  const archivedListings = listings.filter(l => l.archivedAt);
  
  const getCategoryObj = (catId: string | null) => {
    if (!catId) return null;
    for (const cat of categories) {
      if (cat.id === catId) return cat;
      if (cat.subCategories) {
        const sub = cat.subCategories.find(s => s.id === catId);
        if (sub) return sub;
      }
    }
    return null;
  };

  const getCategoryLabel = (cat: any) => {
    if (!cat) return '';
    const lang = language as 'en' | 'ar';
    if (cat.name && cat.name[lang]) return cat.name[lang];
    return t(cat.labelKey);
  };

  const currentCategory = getCategoryObj(selectedCategory);
  const hasSubCategories = currentCategory?.subCategories && currentCategory.subCategories.length > 0;

  const displayedListings = activeTab === 'categories' && selectedCategory
    ? activeListings.filter(l => l.categoryKey === selectedCategory)
    : archivedListings;

  const logActivity = async (action: string, details: string) => {
    if (!db || !user) return;
    try {
      await addDoc(collection(db, 'admin_logs'), {
        adminEmail: user.email,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const handleArchive = async (id: string) => {
    if (!db) return;
    const product = listings.find(l => l.id === id);
    await updateDoc(doc(db, 'products', id), {
      archivedAt: new Date().toISOString()
    });
    await logActivity('ARCHIVE', `Archived product: ${product?.name?.en || id}`);
    setListingToDelete(null);
  };

  const handleRecover = async (id: string) => {
    if (!db) return;
    const product = listings.find(l => l.id === id);
    await updateDoc(doc(db, 'products', id), {
      archivedAt: null
    });
    await logActivity('RECOVER', `Recovered product: ${product?.name?.en || id}`);
  };

  const handlePermanentDelete = async (id: string) => {
    if (!db) return;
    try {
      const productToDelete = listings.find(l => l.id === id);
      
      // Note: Deleting from Cloudinary client-side requires a signed request.
      // For now, we just remove the Firestore document.
      
      await deleteDoc(doc(db, 'products', id));
      await logActivity('DELETE', `Permanently deleted product: ${productToDelete?.name?.en || id}`);
    } catch (error) {
      console.error("Error permanently deleting product:", error);
      alert(t('admin_alert_delete_failed'));
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions to ensure high quality but low storage
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to WebP format with 80% quality (excellent balance of quality and size)
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !storage || (!imageFile && !isTestListing && !editingListing)) return;
    
    // Safety check: Prevent exceeding free tier limits
    if (!editingListing && listings.length >= MAX_LISTINGS) {
      alert(`Safety Limit Reached: You cannot add more than ${MAX_LISTINGS} products to stay within the free tier. Please delete some existing products first.`);
      return;
    }

    setIsSubmitting(true);
    
    let finalNameEn = nameEn.trim();
    let finalNameAr = nameAr.trim();
    let finalDescEn = descEn.trim();
    let finalDescAr = descAr.trim();

    // Validation
    const isActuallyEmpty = !finalNameEn && !finalNameAr && !finalDescEn && !finalDescAr;
    const isDeveloperTest = isTestListing && isDeveloper;

    if (!isDeveloperTest || !isActuallyEmpty) {
      if (!finalNameEn && !finalNameAr) {
        alert(t('admin_alert_name_required'));
        setIsSubmitting(false);
        return;
      }
      if (!finalDescEn && !finalDescAr) {
        alert(t('admin_alert_desc_required'));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isDeveloperTest && isActuallyEmpty) {
        // Default test listing
        finalNameEn = `Test Product ${listings.length + 1}`;
        finalNameAr = `منتج تجريبي ${listings.length + 1}`;
        finalDescEn = "This is a default test listing created by a developer for system verification.";
        finalDescAr = "هذا إدراج تجريبي افتراضي تم إنشاؤه بواسطة مطور للتحقق من النظام.";
      } else if (!finalNameEn || !finalNameAr || !finalDescEn || !finalDescAr) {
        try {
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error("Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.");
          }
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `You are a professional translator for a luxury furniture brand. 
          Translate the missing fields between English and Arabic.
          
          Rules:
          1. Return ONLY a valid JSON object.
          2. Do not include any markdown formatting (no \`\`\`json).
          3. If a field is already provided, keep it as is.
          4. Ensure the Arabic translation is elegant and professional.
          
          Current Data:
          ${JSON.stringify({
            nameEn: finalNameEn,
            nameAr: finalNameAr,
            descEn: finalDescEn,
            descAr: finalDescAr
          }, null, 2)}`;
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  nameEn: { type: Type.STRING },
                  nameAr: { type: Type.STRING },
                  descEn: { type: Type.STRING },
                  descAr: { type: Type.STRING }
                },
                required: ["nameEn", "nameAr", "descEn", "descAr"]
              }
            }
          });
          
          const rawText = response.text || "{}";
          const cleanText = rawText.replace(/```json|```/g, '').trim();
          const result = JSON.parse(cleanText || "{}");
          
          finalNameEn = result.nameEn || finalNameEn;
          finalNameAr = result.nameAr || finalNameAr;
          finalDescEn = result.descEn || finalDescEn;
          finalDescAr = result.descAr || finalDescAr;
        } catch (err) {
          console.error("Translation error:", err);
          alert(t('admin_alert_translate_failed'));
          setIsSubmitting(false);
          return;
        }
      }

      let finalImageUrl = editingListing?.imageUrl || '';
      if (isTestListing && isDeveloper && !imageFile && !editingListing) {
        // Use one of the test images
        finalImageUrl = TEST_IMAGES[Math.floor(Math.random() * TEST_IMAGES.length)];
      } else if (imageFile) {
        // Compress and convert image to WebP
        const compressedBlob = await compressImage(imageFile);
        
        // Try Cloudinary first, fallback to Firebase Storage if configured
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (cloudName && uploadPreset) {
          // Upload to Cloudinary (Unsigned)
          const formData = new FormData();
          formData.append('file', compressedBlob);
          formData.append('upload_preset', uploadPreset);
          formData.append('folder', 'raafat_furniture');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary Upload Failed: ${errorData.error?.message || 'Unknown error'}`);
          }

          const data = await response.json();
          // Use Cloudinary's auto-optimization parameters in the URL
          finalImageUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        } else {
          throw new Error("No image hosting service configured. Please set up Cloudinary.");
        }
      } else if (!editingListing) {
        alert(t('admin_alert_image_required') || 'Image is required');
        setIsSubmitting(false);
        return;
      }

      const parsedPrice = price ? parseFloat(price) : undefined;
      
      if (editingListing) {
        // Update existing listing
        await updateDoc(doc(db, 'products', editingListing.id), {
          name: { en: finalNameEn, ar: finalNameAr },
          description: { en: finalDescEn, ar: finalDescAr },
          categoryKey: category,
          imageUrl: finalImageUrl,
          price: parsedPrice,
          updatedAt: new Date().toISOString()
        });

        await logActivity('UPDATE_LISTING', `Updated listing: ${finalNameEn}`);
      } else {
        // Create new listing
        await addDoc(collection(db, 'products'), {
          name: { en: finalNameEn, ar: finalNameAr },
          description: { en: finalDescEn, ar: finalDescAr },
          categoryKey: category,
          imageUrl: finalImageUrl,
          price: parsedPrice,
          createdAt: new Date().toISOString(),
          archivedAt: null,
          isTest: isTestListing
        });

        await logActivity('CREATE_LISTING', `Created new listing: ${finalNameEn}`);
      }

      // Reset form
      setNameEn(''); setNameAr(''); setDescEn(''); setDescAr('');
      setCategory(categories[0]?.id || ''); setImageFile(null); setPrice('');
      setIsTestListing(false);
      setIsCreateModalOpen(false);
      setEditingListing(null);
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      alert(error.message || "An error occurred while saving the listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !isDeveloper) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        // Update category image
        let finalImageUrl = editingCategory.imageUrl;
        if (imageFile) {
          const compressedBlob = await compressImage(imageFile);
          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

          if (cloudName && uploadPreset) {
            const formData = new FormData();
            formData.append('file', compressedBlob);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'raafat_furniture/categories');

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              { method: 'POST', body: formData }
            );

            if (response.ok) {
              const data = await response.json();
              finalImageUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
            }
          }
        }

        // Check if it's a top-level category or a subcategory
        const parentCat = categories.find(c => c.subCategories?.some(s => s.id === editingCategory.id));
        
        if (parentCat) {
          // Update subcategory in parent
          const updatedSubCategories = parentCat.subCategories?.map(s => 
            s.id === editingCategory.id ? { ...s, imageUrl: finalImageUrl, name: editingCategoryName } : s
          );
          await updateDoc(doc(db, 'categories', parentCat.id), {
            subCategories: updatedSubCategories
          });
        } else {
          // Update top-level category
          await updateDoc(doc(db, 'categories', editingCategory.id), {
            imageUrl: finalImageUrl,
            name: editingCategoryName
          });
        }

        await logActivity('UPDATE_CATEGORY', `Updated category: ${editingCategory.id}`);
      } else if (selectedCategory) {
        // Add subcategories to existing category
        const parentCat = categories.find(c => c.id === selectedCategory);
        if (!parentCat) throw new Error("Parent category not found");

        const newSubs = newCategoryNames.filter(n => n.trim()).map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          labelKey: `cat_${name.toLowerCase().replace(/\s+/g, '_')}`,
          name: { en: name, ar: name }, // Use same name for both for now
          imageUrl: 'https://picsum.photos/seed/' + name + '/800/1000'
        }));

        const updatedSubCategories = [...(parentCat.subCategories || []), ...newSubs];
        await updateDoc(doc(db, 'categories', parentCat.id), {
          subCategories: updatedSubCategories
        });

        // Redistribute listings
        for (const [listingId, subCatId] of Object.entries(redistributionMap)) {
          if (subCatId) {
            await updateDoc(doc(db, 'products', listingId), {
              categoryKey: subCatId
            });
          }
        }

        await logActivity('ADD_SUBCATEGORIES', `Added ${newSubs.length} subcategories to ${selectedCategory}`);
      } else {
        // Add new top-level categories
        for (const name of newCategoryNames.filter(n => n.trim())) {
          const id = name.toLowerCase().replace(/\s+/g, '_');
          await addDoc(collection(db, 'categories'), {
            id,
            labelKey: `cat_${id}`,
            name: { en: name, ar: name },
            imageUrl: 'https://picsum.photos/seed/' + id + '/800/1000',
            subCategories: []
          });
        }
        await logActivity('ADD_CATEGORIES', `Added ${newCategoryNames.length} new categories`);
      }

      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setNewCategoryNames(['']);
      setImageFile(null);
      setRedistributionMap({});
      setListingsToRedistribute([]);
    } catch (error) {
      console.error("Error managing categories:", error);
      alert("Failed to update categories");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-[var(--color-background)] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col border-r border-[var(--color-secondary)]/5 bg-[var(--color-background)] z-30 transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-lg z-40 hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-6 border-b border-[var(--color-secondary)]/5 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-4'}`}>
          {!isSidebarCollapsed && (
            <>
              <LogoIcon size={48} className="shrink-0 shadow-lg rounded-xl" />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
                <p className="text-sm font-bold text-[var(--color-text-primary)] truncate leading-tight">
                  {firstName && lastName ? `${firstName} ${lastName}` : t('account_admin')}
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)] truncate opacity-70">{user.email}</p>
              </motion.div>
            </>
          )}
          {isSidebarCollapsed && (
            <LogoIcon size={40} className="shadow-md rounded-lg" />
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('categories')}
            title={isSidebarCollapsed ? t('admin_tab_categories') : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'categories' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/5'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Folder size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{t('admin_tab_categories')}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            title={isSidebarCollapsed ? t('admin_tab_archive') : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'archive' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/5'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <div className="relative shrink-0">
              <Archive size={20} />
              {archivedListings.length > 0 && isSidebarCollapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-primary)] rounded-full border border-[var(--color-background)]"></span>
              )}
            </div>
            {!isSidebarCollapsed && (
              <>
                <span className="truncate">{t('admin_tab_archive')}</span>
                {archivedListings.length > 0 && (
                  <span className="ms-auto bg-[var(--color-primary)] text-white text-xs py-0.5 px-2 rounded-full">
                    {archivedListings.length}
                  </span>
                )}
              </>
            )}
          </button>
          {isDeveloper && (
            <button 
              onClick={() => setActiveTab('logs')}
              title={isSidebarCollapsed ? t('admin_tab_logs') : ''}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'logs' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/5'} ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Activity size={20} className="shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">{t('admin_tab_logs')}</span>}
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-[var(--color-secondary)]/5 space-y-2">
          <Link 
            to="/"
            title={isSidebarCollapsed ? t('admin_back_to_site') : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/5 rounded-xl font-medium transition-colors ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Home size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{t('admin_back_to_site')}</span>}
          </Link>
          <button 
            onClick={logout}
            title={isSidebarCollapsed ? t('account_signout') : ''}
            className={`w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-medium transition-colors ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">{t('account_signout')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--color-secondary)]/5 bg-[var(--color-background)] sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <LogoIcon size={32} className="rounded-lg shadow-sm" />
          <div className="overflow-hidden max-w-[150px]">
            <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
              {firstName && lastName ? `${firstName} ${lastName}` : t('account_admin')}
            </p>
            <p className="text-[9px] text-[var(--color-text-secondary)] truncate opacity-70">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)]/5 rounded-full">
            <Home size={20} />
          </Link>
          <button onClick={logout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-[var(--color-background)] border-t border-[var(--color-secondary)]/5 z-40 flex justify-around p-2 pb-safe">
        <button onClick={() => { setActiveTab('categories'); setSelectedCategory(null); }} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'categories' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-text-secondary)]'}`}>
          <Folder size={20} />
          <span className="text-[10px] mt-1 font-medium">{t('admin_tab_categories')}</span>
        </button>
        <button onClick={() => setActiveTab('archive')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'archive' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-text-secondary)]'}`}>
          <div className="relative">
            <Archive size={20} />
            {archivedListings.length > 0 && (
              <span className="absolute -top-1 -end-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                {archivedListings.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">{t('admin_tab_archive')}</span>
        </button>
        {isDeveloper && (
          <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'logs' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-text-secondary)]'}`}>
            <Activity size={20} />
            <span className="text-[10px] mt-1 font-medium">{t('admin_tab_logs')}</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 relative overflow-y-auto h-full pb-24 md:pb-8">
        {activeTab === 'categories' && !selectedCategory && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 md:mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">{t('admin_tab_categories')}</h1>
                <p className="text-[var(--color-text-secondary)] mt-2">{t('admin_select_category')}</p>
              </div>
              {isDeveloper && (
                <button 
                  onClick={() => setIsHeroModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 rounded-xl transition-colors text-[var(--color-text-primary)] font-medium"
                >
                  <ImageIcon size={18} />
                  Edit Hero
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
              {categories.map((cat, index) => (
                <motion.div 
                  key={cat.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 1, 0.5, 1] }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="relative group text-center flex flex-col h-full cursor-pointer"
                >
                  <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative">
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.id} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                    
                    {isDeveloper && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                          setEditingCategoryName(cat.name || { en: t(cat.labelKey), ar: t(cat.labelKey) });
                        }}
                        className="absolute top-3 end-3 p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-blue-50 shadow-sm z-10"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                      {getCategoryLabel(cat)}
                    </h3>
                    <p className="text-md text-[var(--color-text-secondary)]">
                      {activeListings.filter(l => l.categoryKey === cat.id).length} {t('admin_items')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && selectedCategory && hasSubCategories && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 bg-[var(--color-secondary)]/5 hover:bg-[var(--color-secondary)]/10 rounded-full transition-colors text-[var(--color-text-secondary)] relative z-10"
                >
                  <span className="block"><ArrowLeft size={20} /></span>
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  {getCategoryLabel(currentCategory)}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
              {currentCategory?.subCategories?.map((cat, index) => (
                <motion.div 
                  key={cat.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 1, 0.5, 1] }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="relative group text-center flex flex-col h-full cursor-pointer"
                >
                  <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative">
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.id} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                    
                    {isDeveloper && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                          setEditingCategoryName(cat.name || { en: t(cat.labelKey), ar: t(cat.labelKey) });
                        }}
                        className="absolute top-3 end-3 p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-blue-50 shadow-sm z-10"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                      {getCategoryLabel(cat)}
                    </h3>
                    <p className="text-md text-[var(--color-text-secondary)]">
                      {activeListings.filter(l => l.categoryKey === cat.id).length} {t('admin_items')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && selectedCategory && !hasSubCategories && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    let parentId = null;
                    for (const cat of categories) {
                      if (cat.subCategories?.some(s => s.id === selectedCategory)) {
                        parentId = cat.id;
                        break;
                      }
                    }
                    setSelectedCategory(parentId);
                  }}
                  className="p-2 bg-[var(--color-secondary)]/5 hover:bg-[var(--color-secondary)]/10 rounded-full transition-colors text-[var(--color-text-secondary)] relative z-10"
                >
                  <span className="block"><ArrowLeft size={20} /></span>
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  {getCategoryLabel(currentCategory)} {t('admin_listings')}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
              {displayedListings.map(listing => (
                <motion.div 
                  key={listing.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group text-center flex flex-col h-full"
                >
                  <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative">
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.name.en} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <button 
                      onClick={() => setListingToDelete(listing)}
                      className="absolute top-3 end-3 p-2 bg-white/90 backdrop-blur-sm text-red-600 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-50 shadow-sm z-10"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingListing(listing);
                        setNameEn(listing.name.en);
                        setNameAr(listing.name.ar);
                        setDescEn(listing.description.en);
                        setDescAr(listing.description.ar);
                        setCategory(listing.categoryKey);
                        setPrice(listing.price?.toString() || '');
                        setIsCreateModalOpen(true);
                      }}
                      className="absolute top-3 start-3 p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-blue-50 shadow-sm z-10"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                    {language === 'ar' ? listing.name.ar : listing.name.en}
                  </h3>
                  <p className="text-md text-[var(--color-text-secondary)] capitalize">
                    {getCategoryLabel(currentCategory)}
                  </p>
                </motion.div>
              ))}
              {displayedListings.length === 0 && (
                <div className="col-span-full py-12 text-center text-[var(--color-text-secondary)] bg-[var(--color-secondary)]/5 rounded-2xl border border-dashed border-[var(--color-secondary)]/10">
                  {t('admin_no_listings')}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* FABs */}
        {activeTab === 'categories' && (
          <div className="fixed bottom-24 md:bottom-8 end-6 md:end-8 flex flex-col gap-4 z-30">
            {isDeveloper && (
              <button 
                onClick={() => {
                  setNewCategoryNames(['']);
                  setIsCategoryModalOpen(true);
                  if (selectedCategory) {
                    const catListings = activeListings.filter(l => l.categoryKey === selectedCategory);
                    setListingsToRedistribute(catListings);
                    setRedistributionMap({});
                  } else {
                    setListingsToRedistribute([]);
                  }
                }}
                className="w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all"
                title={selectedCategory ? "Add Sub-categories" : "Add Category"}
              >
                <Plus size={20} />
              </button>
            )}
            {selectedCategory && !hasSubCategories && (
              <button 
                onClick={() => {
                  setCategory(selectedCategory);
                  setIsCreateModalOpen(true);
                }}
                className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg shadow-[var(--color-primary)]/30 flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all"
              >
                <Plus size={24} />
              </button>
            )}
          </div>
        )}

        {activeTab === 'archive' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {!selectedArchivedCategory ? (
              <>
                <div className="mb-6 md:mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">{t('admin_archived')}</h1>
                  <p className="text-[var(--color-text-secondary)] mt-2">{t('admin_select_category')}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
                  {archivedListings.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[var(--color-text-secondary)] bg-[var(--color-secondary)]/5 rounded-2xl border border-dashed border-[var(--color-secondary)]/10">
                      {t('admin_no_listings')}
                    </div>
                  ) : (
                    categories.reduce((acc, cat) => {
                      acc.push(cat);
                      if (cat.subCategories) acc.push(...cat.subCategories);
                      return acc;
                    }, [] as any[]).map((cat, index) => {
                      const count = archivedListings.filter(l => l.categoryKey === cat.id).length;
                      if (count === 0) return null;
                      return (
                      <motion.div 
                        key={cat.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 1, 0.5, 1] }}
                        whileHover={{ scale: 1.03, y: -8 }}
                        onClick={() => setSelectedArchivedCategory(cat.id)}
                        className="relative group text-center flex flex-col h-full cursor-pointer"
                      >
                        <div className="bg-[var(--color-secondary)] rounded-3xl overflow-hidden mb-4 transition-shadow duration-300 hover:shadow-xl aspect-[4/5] w-full relative opacity-60 grayscale">
                          <img 
                            src={cat.imageUrl} 
                            alt={cat.id} 
                            className="absolute inset-0 w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                        </div>
                        <div className="p-4 flex flex-col items-center">
                          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-auto">
                            {getCategoryLabel(cat)}
                          </h3>
                          <p className="text-md text-[var(--color-text-secondary)]">
                            {count} {t('admin_items')}
                          </p>
                        </div>
                      </motion.div>
                    )})
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <button 
                    onClick={() => setSelectedArchivedCategory(null)}
                    className="p-2 bg-[var(--color-secondary)]/5 hover:bg-[var(--color-secondary)]/10 rounded-full transition-colors text-[var(--color-text-secondary)] relative z-10"
                  >
                    <span className="block"><ArrowLeft size={20} /></span>
                  </button>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                    {t('admin_archived')}: {getCategoryLabel(getCategoryObj(selectedArchivedCategory))}
                  </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {archivedListings.filter(l => l.categoryKey === selectedArchivedCategory).map(listing => {
                    const daysSinceArchived = differenceInDays(new Date(), parseISO(listing.archivedAt));
                    const daysLeft = Math.max(0, 14 - daysSinceArchived);
                    const isExpired = daysLeft === 0;

                    return (
                      <div key={listing.id} className="bg-[var(--color-secondary)]/5 rounded-2xl overflow-hidden shadow-sm border border-[var(--color-secondary)]/10 flex flex-col">
                        <div className="aspect-[4/3] relative opacity-60 grayscale">
                          <img src={listing.imageUrl} alt={listing.name.en} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">{language === 'ar' ? listing.name.ar : listing.name.en}</h3>
                          <div className="mt-2 text-xs md:text-sm font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md inline-block w-fit">
                            {isExpired ? t('admin_pending_deletion') : `${daysLeft} ${t('admin_days_left')}`}
                          </div>
                          <div className="mt-4 pt-4 border-t border-[var(--color-secondary)]/10 flex gap-2 mt-auto">
                            <button 
                              onClick={() => handleRecover(listing.id)}
                              className="flex-1 py-2 bg-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--color-secondary)]/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <RefreshCw size={16} /> {t('admin_recover')}
                            </button>
                            {isExpired && (
                              <button 
                                onClick={() => handlePermanentDelete(listing.id)}
                                className="py-2 px-3 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {archivedListings.filter(l => l.categoryKey === selectedArchivedCategory).length === 0 && (
                    <div className="col-span-full py-12 text-center text-[var(--color-text-secondary)] bg-[var(--color-secondary)]/5 rounded-2xl border border-dashed border-[var(--color-secondary)]/20">
                      {t('admin_no_archived')}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'logs' && isDeveloper && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-6 md:mb-8">{t('admin_tab_logs')}</h1>
            <div className="bg-[var(--color-secondary)]/5 rounded-2xl border border-[var(--color-secondary)]/10 overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[600px] text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-secondary)]/10 text-[var(--color-text-secondary)] text-sm">
                      <th className="py-2 px-3 md:p-4 font-medium border-b border-[var(--color-secondary)]/10 w-32 md:w-40">{t('admin_time')}</th>
                      <th className="py-2 px-3 md:p-4 font-medium border-b border-[var(--color-secondary)]/10 w-40 md:w-48">{t('admin_admin')}</th>
                      <th className="py-2 px-3 md:p-4 font-medium border-b border-[var(--color-secondary)]/10 w-24 md:w-32">{t('admin_action')}</th>
                      <th className="py-2 px-3 md:p-4 font-medium border-b border-[var(--color-secondary)]/10">{t('admin_details')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => {
                      const profile = userProfiles[log.adminEmail];
                      const displayName = profile ? `${profile.firstName} ${profile.lastName}` : log.adminEmail;
                      const formattedTime = new Date(log.timestamp).toLocaleString([], { 
                        year: 'numeric', 
                        month: 'numeric', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });

                      return (
                        <tr key={log.id} className="border-b border-[var(--color-secondary)]/5 hover:bg-[var(--color-secondary)]/5 transition-colors">
                          <td className="py-2 px-3 md:p-4 text-xs md:text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                            {formattedTime}
                          </td>
                          <td className="py-2 px-3 md:p-4 text-xs md:text-sm text-[var(--color-text-primary)] font-medium truncate max-w-[120px] md:max-w-none" title={log.adminEmail}>
                            {displayName}
                          </td>
                          <td className="py-2 px-3 md:p-4 text-xs md:text-sm">
                            <span className={`px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold ${
                              log.action === 'CREATE' ? 'bg-green-500/10 text-green-500' :
                              log.action === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                              log.action === 'ARCHIVE' ? 'bg-orange-500/10 text-orange-500' :
                              'bg-blue-500/10 text-blue-500'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 md:p-4 text-xs md:text-sm text-[var(--color-text-secondary)] break-words">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[var(--color-text-secondary)]">
                          {t('admin_no_logs')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Create Listing Modal */}
      <AnimatePresence>
      {isCreateModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="p-4 md:p-6 border-b border-[var(--color-secondary)]/10 flex justify-between items-center sticky top-0 bg-[var(--color-background)] z-10">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                {editingListing ? t('admin_edit_listing') || 'Edit Listing' : t('admin_create_new')}
              </h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingListing(null);
                  setNameEn(''); setNameAr(''); setDescEn(''); setDescAr('');
                  setCategory(categories[0]?.id || ''); setPrice(''); setImageFile(null);
                }} 
                className="p-2 hover:bg-[var(--color-secondary)]/10 rounded-full transition-colors text-[var(--color-text-secondary)]"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('admin_name_en')}</label>
                  <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" placeholder={t('admin_placeholder_name_en')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('admin_name_ar')}</label>
                  <input type="text" value={nameAr} onChange={e => setNameAr(e.target.value)} className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-right" placeholder={t('admin_placeholder_name_ar')} dir="rtl" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('admin_desc_en')}</label>
                  <textarea value={descEn} onChange={e => setDescEn(e.target.value)} rows={3} className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none" placeholder={t('admin_placeholder_desc_en')}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('admin_desc_ar')}</label>
                  <textarea value={descAr} onChange={e => setDescAr(e.target.value)} rows={3} className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none text-right" placeholder={t('admin_placeholder_desc_ar')} dir="rtl"></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('admin_category')}</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none">
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={t(cat.labelKey)}>
                        <option value={cat.id}>{t(cat.labelKey)} (Main)</option>
                        {cat.subCategories?.map(sub => (
                          <option key={sub.id} value={sub.id}>-- {t(sub.labelKey)}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('admin_price')} ({t('admin_optional')})</label>
                  <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" placeholder={t('admin_placeholder_price')} />
                </div>
              </div>

              {isDeveloper && !editingListing && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="test-listing" 
                    checked={isTestListing} 
                    onChange={e => setIsTestListing(e.target.checked)}
                    className="w-5 h-5 accent-[var(--color-primary)]"
                  />
                  <label htmlFor="test-listing" className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                    <Beaker size={16} className="text-blue-500" />
                    Create as Test Listing
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  {editingListing ? t('admin_change_photo') || 'Change Photo' : t('admin_photo_min')}
                </label>
                <div className={`border-2 border-dashed border-[var(--color-text-primary)]/10 rounded-xl p-6 md:p-8 text-center hover:bg-[var(--color-text-primary)]/5 transition-colors relative ${isTestListing && !imageFile ? 'opacity-50' : ''}`}>
                  <input 
                    type="file" 
                    required={!isTestListing && !editingListing}
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {imageFile ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon size={32} className="text-[var(--color-primary)] mb-2" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{imageFile.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t('admin_click_to_change')}</p>
                    </div>
                  ) : isTestListing ? (
                    <div className="flex flex-col items-center">
                      <Beaker size={32} className="text-blue-500 mb-2" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Using Random Test Image</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">Click or drag to override with custom image</p>
                    </div>
                  ) : editingListing ? (
                    <div className="flex flex-col items-center">
                      <img src={editingListing.imageUrl} alt="Current" className="w-20 h-20 object-cover rounded-lg mb-2 opacity-50" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{t('admin_click_to_change')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Plus size={32} className="text-[var(--color-text-secondary)] mb-2" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{t('admin_click_to_upload')}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t('admin_photo_format')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-secondary)]/10 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingListing(null);
                    setNameEn(''); setNameAr(''); setDescEn(''); setDescAr('');
                    setCategory(categories[0]?.id || ''); setPrice(''); setImageFile(null);
                  }} 
                  className="px-4 md:px-6 py-3 text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-secondary)]/10 rounded-xl transition-colors"
                >
                  {t('admin_cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 md:px-8 py-3 bg-[var(--color-primary)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center gap-2">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingListing ? t('admin_update_listing') || 'Update Listing' : t('admin_post_listing'))}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
      {(isCategoryModalOpen || editingCategory) && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10"
          >
            <div className="p-4 md:p-6 border-b border-[var(--color-secondary)]/10 flex justify-between items-center sticky top-0 bg-[var(--color-background)] z-10">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                {editingCategory ? 'Edit Category' : (selectedCategory ? 'Add Sub-categories' : 'Add New Category')}
              </h2>
              <button 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setEditingCategoryName({ en: '', ar: '' });
                  setNewCategoryNames(['']);
                  setImageFile(null);
                }} 
                className="p-2 hover:bg-[var(--color-secondary)]/10 rounded-full transition-colors text-[var(--color-text-secondary)]"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-4 md:p-6 space-y-6">
              {editingCategory ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Name (English)</label>
                      <input 
                        type="text" 
                        value={editingCategoryName.en} 
                        onChange={e => setEditingCategoryName({ ...editingCategoryName, en: e.target.value })}
                        className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] text-right">الاسم (العربية)</label>
                      <input 
                        type="text" 
                        value={editingCategoryName.ar} 
                        onChange={e => setEditingCategoryName({ ...editingCategoryName, ar: e.target.value })}
                        className="w-full bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Category Image</label>
                    <div className="border-2 border-dashed border-[var(--color-text-primary)]/10 rounded-xl p-8 text-center hover:bg-[var(--color-text-primary)]/5 transition-colors relative">
                      <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      {imageFile ? (
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{imageFile.name}</p>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Plus size={32} className="text-[var(--color-text-secondary)] mb-2" />
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">Click to upload new picture</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Category Names</label>
                    {newCategoryNames.map((name, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => {
                            const updated = [...newCategoryNames];
                            updated[idx] = e.target.value;
                            setNewCategoryNames(updated);
                          }}
                          className="flex-1 bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                          placeholder="Enter name..."
                        />
                        {newCategoryNames.length > 1 && (
                          <button type="button" onClick={() => setNewCategoryNames(newCategoryNames.filter((_, i) => i !== idx))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setNewCategoryNames([...newCategoryNames, ''])} className="flex items-center gap-2 text-blue-600 font-medium hover:underline">
                      <PlusCircle size={18} /> Add another
                    </button>
                  </div>

                  {selectedCategory && listingsToRedistribute.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-[var(--color-secondary)]/10">
                      <h3 className="font-bold text-[var(--color-text-primary)]">Distribute Existing Listings</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">Choose which sub-category each listing should move to.</p>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {listingsToRedistribute.map(listing => (
                          <div key={listing.id} className="flex items-center justify-between p-3 bg-[var(--color-secondary)]/5 rounded-xl border border-[var(--color-secondary)]/10">
                            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                              {language === 'ar' ? listing.name.ar : listing.name.en}
                            </span>
                            <select 
                              value={redistributionMap[listing.id] || ''} 
                              onChange={e => setRedistributionMap({...redistributionMap, [listing.id]: e.target.value})}
                              className="bg-transparent border border-[var(--color-secondary)]/10 text-[var(--color-text-primary)] rounded-lg px-2 py-1 text-xs outline-none"
                            >
                              <option value="">Keep in Main</option>
                              {newCategoryNames.filter(n => n.trim()).map(name => (
                                <option key={name} value={name.toLowerCase().replace(/\s+/g, '_')}>{name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-[var(--color-secondary)]/10 flex justify-end gap-3">
                <button type="button" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setEditingCategoryName({ en: '', ar: '' }); }} className="px-6 py-3 text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-secondary)]/10 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

              {/* Delete Confirm Modal */}
              <AnimatePresence>
              {listingToDelete && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 text-center border border-white/10"
                  >
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trash2 size={32} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-3">{t('admin_remove_listing')}</h2>
                    <p className="text-[var(--color-text-secondary)] mb-8">{t('admin_archived_auto_remove')}</p>
                    <div className="flex gap-3">
                      <button onClick={() => setListingToDelete(null)} className="flex-1 py-3 text-[var(--color-text-primary)] font-medium bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 rounded-xl transition-colors">
                        {t('admin_cancel')}
                      </button>
                      <button onClick={() => handleArchive(listingToDelete.id)} className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors">
                        {t('admin_archive')}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* Hero Image Modal */}
              <AnimatePresence>
              {isHeroModalOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[var(--color-background)] rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 border border-white/10"
                  >
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] mb-6">Update Hero Image</h2>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          try {
                            // Compress and convert image to WebP
                            const compressedBlob = await compressImage(file);
                            
                            // Upload to Cloudinary
                            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                            if (!cloudName || !uploadPreset) {
                                throw new Error("Cloudinary not configured.");
                            }

                            const formData = new FormData();
                            formData.append('file', compressedBlob);
                            formData.append('upload_preset', uploadPreset);
                            formData.append('folder', 'raafat_furniture/hero');

                            const response = await fetch(
                                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                                { method: 'POST', body: formData }
                            );

                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(`Cloudinary Upload Failed: ${errorData.error?.message || 'Unknown error'}`);
                            }

                            const data = await response.json();
                            const url = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
                            
                            // Update Firestore with new URL
                            console.log("Saving hero image:", url);
                            // TODO: Implement Firestore update logic here
                            setHeroImageUrl(url);
                            setIsHeroModalOpen(false);
                          } catch (error) {
                            console.error("Error uploading hero image:", error);
                            alert("Failed to upload hero image.");
                          }
                      }}
                      className="w-full text-sm text-[var(--color-text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <button 
                      onClick={() => setIsHeroModalOpen(false)}
                      className="w-full mt-6 py-3 text-[var(--color-text-primary)] font-medium bg-[var(--color-secondary)]/10 hover:bg-[var(--color-secondary)]/20 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>

            </div>
          );
        };

export default Admin;
