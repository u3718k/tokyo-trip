import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { DaySchedule, BookingItem, PackingItem, ItineraryItem, GuideLocation } from '../types';
import { ITINERARY, INITIAL_BOOKINGS, PACKING_LIST_INITIAL, GUIDE_SPOTS, FIREBASE_CONFIG } from '../constants';

// Standard Modular SDK Imports
// @ts-ignore
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import type { FirebaseApp } from 'firebase/app';
import { 
  getFirestore, doc, onSnapshot, setDoc, updateDoc, deleteField, 
  collection, deleteDoc, writeBatch, getDoc 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// --- Local Storage Keys ---
const STORAGE_KEYS = {
  ITINERARY: 'trip_itinerary',
  BOOKINGS: 'trip_bookings',
  GUIDES: 'trip_guides',
  PACKING: 'trip_packing_list',
  MEMO: 'trip_memo_list',
  WISH: 'trip_wish_list',
  PHOTOS: 'trip_photos',
  FIREBASE_CONFIG: 'trip_firebase_config'
};

// Document IDs in Firestore
const DOC_MAIN = 'tokyo_trip_2025_shared';       // Itinerary, Lists
// Legacy Docs (for migration)
const DOC_BOOKINGS_LEGACY = 'tokyo_trip_2025_bookings'; 
const DOC_PHOTOS_LEGACY = 'tokyo_trip_2025_photos';     
const GUIDE_DOC_PREFIX = 'tokyo_trip_2025_guides_';
const GUIDE_BUCKETS_LEGACY = ['1217', '1218', '1219', '1220', '1221', '1222', 'misc'];

// --- Image Compression Utility ---
export const compressImage = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Better quality compression for good viewing experience
      const MAX_DIMENSION = 1280;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Standard JPEG Quality (0.8)
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
        resolve(base64Str);
    }
  });
};

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface TripContextType {
  // Data
  itinerary: DaySchedule[];
  bookings: BookingItem[];
  guideSpots: GuideLocation[];
  packingList: PackingItem[];
  memoList: PackingItem[];
  wishList: PackingItem[];
  photos: Record<string, string>;

  // Actions
  setItinerary: (data: DaySchedule[]) => void;
  updateItineraryItem: (dayIndex: number, items: ItineraryItem[]) => void;
  
  setBookings: (data: BookingItem[]) => void; // Legacy signature support
  addBooking: (item: BookingItem) => void;
  deleteBooking: (id: string) => void;
  updateBookingPhoto: (id: string, base64: string) => void;
  
  addGuideSpot: (item: GuideLocation) => void;
  deleteGuideSpot: (id: string) => void;
  updateGuideSpot: (item: GuideLocation) => void;
  
  setPackingList: (data: PackingItem[]) => void;
  togglePackingItem: (id: string) => void;
  
  setMemoList: (data: PackingItem[]) => void;
  addMemoItem: (item: PackingItem) => void;
  deleteMemoItem: (id: string) => void;
  toggleMemoItem: (id: string) => void;
  
  setWishList: (data: PackingItem[]) => void;
  addWishItem: (item: PackingItem) => void;
  deleteWishItem: (id: string) => void;
  toggleWishItem: (id: string) => void;
  
  uploadPhoto: (key: string, base64: string) => void;
  removePhoto: (key: string) => void;
  
  // Meta
  exportData: () => void;
  importData: (jsonString: string) => boolean;
  isLoading: boolean;
  error: string | null;
  
  // Cloud Sync
  isCloudMode: boolean;
  cloudConfig: FirebaseConfig | null;
  connectToCloud: (config: FirebaseConfig) => Promise<void>;
  disconnectCloud: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cloud State
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<FirebaseConfig | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // Firebase Refs
  const appRef = useRef<any>(null);
  const dbRef = useRef<Firestore | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const ignoreNextSnapshot = useRef<boolean>(false);

  // --- Data State ---
  const [itinerary, setItineraryState] = useState<DaySchedule[]>(ITINERARY);
  const [bookings, setBookingsState] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [guideSpots, setGuideSpotsState] = useState<GuideLocation[]>(GUIDE_SPOTS);
  const [packingList, setPackingListState] = useState<PackingItem[]>(PACKING_LIST_INITIAL.map(t => ({ id: t, text: t, checked: false })));
  const [memoList, setMemoListState] = useState<PackingItem[]>([]);
  const [wishList, setWishListState] = useState<PackingItem[]>([]);
  const [photos, setPhotosState] = useState<Record<string, string>>({});

  // --- Saver Helper ---
  const sanitizeForFirestore = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        return value === undefined ? null : value;
    }));
  };

  // --- Migration Logic ---
  const performMigration = async (db: Firestore) => {
      console.log("Checking for legacy data migration...");
      const batch = writeBatch(db);
      let migrationNeeded = false;

      // 1. Migrate Bookings (Doc -> Subcollection)
      try {
          const bookingDocRef = doc(db, 'trips', DOC_BOOKINGS_LEGACY);
          const bookingSnap = await getDoc(bookingDocRef);
          if (bookingSnap.exists()) {
              const data = bookingSnap.data();
              if (data.bookings && Array.isArray(data.bookings) && data.bookings.length > 0) {
                  console.log(`Migrating ${data.bookings.length} bookings...`);
                  data.bookings.forEach((b: BookingItem) => {
                      const newRef = doc(db, 'trips', DOC_MAIN, 'bookings', b.id);
                      batch.set(newRef, b);
                  });
                  batch.delete(bookingDocRef);
                  migrationNeeded = true;
              }
          }
      } catch (e) { console.warn("Booking migration check failed", e); }

      // 2. Migrate Guides (Buckets -> Subcollection)
      for (const bucket of GUIDE_BUCKETS_LEGACY) {
          try {
              const guideRef = doc(db, 'trips', `${GUIDE_DOC_PREFIX}${bucket}`);
              const guideSnap = await getDoc(guideRef);
              if (guideSnap.exists()) {
                  const data = guideSnap.data();
                  if (data.guideSpots && Array.isArray(data.guideSpots) && data.guideSpots.length > 0) {
                       console.log(`Migrating guides from bucket ${bucket}...`);
                       data.guideSpots.forEach((g: GuideLocation) => {
                           const newRef = doc(db, 'trips', DOC_MAIN, 'guides', g.id);
                           batch.set(newRef, g);
                       });
                       batch.delete(guideRef);
                       migrationNeeded = true;
                  }
              }
          } catch (e) { console.warn(`Guide bucket ${bucket} migration check failed`, e); }
      }

      // 3. Migrate Photos (Doc -> Subcollection)
      try {
          const photoDocRef = doc(db, 'trips', DOC_PHOTOS_LEGACY);
          const photoSnap = await getDoc(photoDocRef);
          if (photoSnap.exists()) {
              const data = photoSnap.data();
              if (data.photos) {
                  console.log("Migrating photos...");
                  Object.entries(data.photos).forEach(([key, base64]) => {
                      const newRef = doc(db, 'trips', DOC_MAIN, 'memories', key);
                      batch.set(newRef, { id: key, data: base64 });
                  });
                  batch.delete(photoDocRef);
                  migrationNeeded = true;
              }
          }
      } catch (e) { console.warn("Photo migration check failed", e); }

      if (migrationNeeded) {
          await batch.commit();
          console.log("Migration completed successfully.");
      } else {
          console.log("No migration needed.");
      }
  };

  // --- Cloud Logic ---
  const handleFirestoreError = (err: any) => {
      console.error("Firebase Error:", err);
      if (err.code === 'resource-exhausted') {
          setError("資料過大，請嘗試刪除部分圖片");
      } else if (err.code === 'permission-denied') {
          setError("連線失敗：權限不足");
      } else {
          setError(`連線中斷: ${err.message}`);
      }
      setConnectionStatus('error');
  };

  const connectToCloud = async (config: FirebaseConfig) => {
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;

      setConnectionStatus('connecting');
      console.log("Starting Firebase connection (Sub-collection Mode)...");

      try {
          // 1. Initialize App
          let app: any;
          try {
            // @ts-ignore
            if (getApps().length === 0) {
              // @ts-ignore
              app = initializeApp(config);
            } else {
              // @ts-ignore
              app = getApp();
            }
            appRef.current = app;
          } catch (initErr: any) {
            throw new Error(`初始化失敗: ${initErr.message}`);
          }

          // 2. Initialize Firestore
          const db = getFirestore(app);
          dbRef.current = db;

          // 3. Perform Migration (One-time check)
          await performMigration(db);

          const unsubs: (() => void)[] = [];

          // --- Listener 1: Main (Itinerary & Lists) ---
          const mainRef = doc(db, 'trips', DOC_MAIN);
          const unsubMain = onSnapshot(mainRef, (docSnap) => {
             if (ignoreNextSnapshot.current) { ignoreNextSnapshot.current = false; return; }

             if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.itinerary) setItineraryState(data.itinerary);
                 if (data.packingList) setPackingListState(data.packingList);
                 if (data.memoList) setMemoListState(data.memoList);
                 if (data.wishList) setWishListState(data.wishList);
                 setError(null);
             } else {
                 setDoc(mainRef, { 
                    itinerary: sanitizeForFirestore(itinerary), 
                    packingList, memoList, wishList 
                 }, { merge: true }).catch(console.error);
             }
             setConnectionStatus('connected');
             setIsCloudMode(true);
             setCloudConfig(config);
             localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
          }, handleFirestoreError);
          unsubs.push(unsubMain);

          // --- Listener 2: Guides (Sub-collection) ---
          const guidesRef = collection(db, 'trips', DOC_MAIN, 'guides');
          const unsubGuides = onSnapshot(guidesRef, (snapshot) => {
              const loadedGuides: GuideLocation[] = [];
              snapshot.forEach(doc => {
                  loadedGuides.push(doc.data() as GuideLocation);
              });
              // Sort by date then id
              loadedGuides.sort((a, b) => {
                  if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
                  return a.id.localeCompare(b.id);
              });
              setGuideSpotsState(loadedGuides);
              // Also update local storage for offline use
              localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(loadedGuides));
          }, handleFirestoreError);
          unsubs.push(unsubGuides);

          // --- Listener 3: Bookings (Sub-collection) ---
          const bookingsRef = collection(db, 'trips', DOC_MAIN, 'bookings');
          const unsubBookings = onSnapshot(bookingsRef, (snapshot) => {
              const loadedBookings: BookingItem[] = [];
              snapshot.forEach(doc => {
                  loadedBookings.push(doc.data() as BookingItem);
              });
              setBookingsState(loadedBookings);
              localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(loadedBookings));
          }, handleFirestoreError);
          unsubs.push(unsubBookings);

          // --- Listener 4: Memories/Photos (Sub-collection) ---
          const memoriesRef = collection(db, 'trips', DOC_MAIN, 'memories');
          const unsubMemories = onSnapshot(memoriesRef, (snapshot) => {
              const loadedPhotos: Record<string, string> = {};
              snapshot.forEach(doc => {
                  const d = doc.data();
                  if (d.id && d.data) {
                      loadedPhotos[d.id] = d.data;
                  }
              });
              setPhotosState(loadedPhotos);
              localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(loadedPhotos));
          }, handleFirestoreError);
          unsubs.push(unsubMemories);

          unsubscribeRef.current = () => {
              unsubs.forEach(u => u());
          };

      } catch (e: any) {
          console.error("Firebase Connection Exception:", e);
          setConnectionStatus('error');
          setError(`無法連線: ${e.message}`);
      }
  };

  const disconnectCloud = () => {
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
    }
    setConnectionStatus('disconnected');
    setIsCloudMode(false);
  };

  // --- Helpers for Persistence ---
  
  // Save specific item to subcollection
  const saveToCloudSub = async (collectionName: 'guides' | 'bookings' | 'memories', id: string, data: any) => {
      if (!isCloudMode || !dbRef.current) return;
      try {
          const ref = doc(dbRef.current, 'trips', DOC_MAIN, collectionName, id);
          await setDoc(ref, sanitizeForFirestore(data));
      } catch (e: any) {
          console.error(`Save to ${collectionName} failed:`, e);
          if (e.code === 'resource-exhausted') setError("圖片過大無法上傳");
      }
  };

  const deleteFromCloudSub = async (collectionName: 'guides' | 'bookings' | 'memories', id: string) => {
      if (!isCloudMode || !dbRef.current) return;
      try {
          const ref = doc(dbRef.current, 'trips', DOC_MAIN, collectionName, id);
          await deleteDoc(ref);
      } catch (e) {
          console.error(`Delete from ${collectionName} failed:`, e);
      }
  };

  // Save main doc fields
  const saveMainDoc = async (field: string, data: any) => {
      if (!isCloudMode || !dbRef.current) return;
      try {
          ignoreNextSnapshot.current = true;
          const ref = doc(dbRef.current, 'trips', DOC_MAIN);
          await setDoc(ref, { [field]: sanitizeForFirestore(data) }, { merge: true });
      } catch (e) {
          ignoreNextSnapshot.current = false;
          console.error(`Save main doc ${field} failed:`, e);
      }
  };

  // --- Actions Implementation ---

  const setItinerary = (data: DaySchedule[]) => { 
      setItineraryState(data); 
      localStorage.setItem(STORAGE_KEYS.ITINERARY, JSON.stringify(data));
      saveMainDoc('itinerary', data);
  };
  
  const updateItineraryItem = (dayIndex: number, items: ItineraryItem[]) => {
    const newData = [...itinerary];
    newData[dayIndex] = { ...newData[dayIndex], items: items };
    setItinerary(newData);
  };

  // Bookings
  const setBookings = (data: BookingItem[]) => {
      // This legacy function is tricky with subcollections. 
      // We should ideally not use setBookings(array) for cloud sync unless we overwrite everything.
      // For now, we update local state.
      setBookingsState(data);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data));
  };

  const addBooking = (item: BookingItem) => {
      const newData = [...bookings, item];
      setBookingsState(newData);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(newData));
      saveToCloudSub('bookings', item.id, item);
  };

  const deleteBooking = (id: string) => {
      const newData = bookings.filter(b => b.id !== id);
      setBookingsState(newData);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(newData));
      deleteFromCloudSub('bookings', id);
  };

  const updateBookingPhoto = (id: string, base64: string) => {
      const newData = bookings.map(b => b.id === id ? { ...b, imageUrl: base64 } : b);
      setBookingsState(newData);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(newData));
      
      const item = newData.find(b => b.id === id);
      if (item) saveToCloudSub('bookings', item.id, item);
  };

  // Guide Spots
  const addGuideSpot = (item: GuideLocation) => {
      const newData = [...guideSpots, item];
      setGuideSpotsState(newData);
      localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(newData));
      saveToCloudSub('guides', item.id, item);
  };

  const deleteGuideSpot = (id: string) => {
      const newData = guideSpots.filter(g => g.id !== id);
      setGuideSpotsState(newData);
      localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(newData));
      deleteFromCloudSub('guides', id);
  };

  const updateGuideSpot = (item: GuideLocation) => {
      const newData = guideSpots.map(g => g.id === item.id ? item : g);
      setGuideSpotsState(newData);
      localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(newData));
      saveToCloudSub('guides', item.id, item);
  };

  // Lists
  const setPackingList = (data: PackingItem[]) => { 
      setPackingListState(data); 
      localStorage.setItem(STORAGE_KEYS.PACKING, JSON.stringify(data));
      saveMainDoc('packingList', data);
  };
  
  const togglePackingItem = (id: string) => {
    const newData = packingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setPackingList(newData);
  };

  const setMemoList = (data: PackingItem[]) => { 
      setMemoListState(data); 
      localStorage.setItem(STORAGE_KEYS.MEMO, JSON.stringify(data));
      saveMainDoc('memoList', data);
  };
  
  const addMemoItem = (item: PackingItem) => {
    const newData = [...memoList, item];
    setMemoList(newData);
  };

  const deleteMemoItem = (id: string) => {
    const newData = memoList.filter(i => i.id !== id);
    setMemoList(newData);
  };

  const toggleMemoItem = (id: string) => {
    const newData = memoList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setMemoList(newData);
  };

  const setWishList = (data: PackingItem[]) => { 
      setWishListState(data); 
      localStorage.setItem(STORAGE_KEYS.WISH, JSON.stringify(data));
      saveMainDoc('wishList', data);
  };
  
  const addWishItem = (item: PackingItem) => {
    const newData = [...wishList, item];
    setWishList(newData);
  };

  const deleteWishItem = (id: string) => {
    const newData = wishList.filter(i => i.id !== id);
    setWishList(newData);
  };

  const toggleWishItem = (id: string) => {
    const newData = wishList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setWishList(newData);
  };

  // Photos (Memories)
  const uploadPhoto = (key: string, base64: string) => {
      const newPhotos = { ...photos, [key]: base64 };
      setPhotosState(newPhotos);
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(newPhotos));
      saveToCloudSub('memories', key, { id: key, data: base64 });
  };

  const removePhoto = (key: string) => {
      const newPhotos = { ...photos };
      delete newPhotos[key];
      setPhotosState(newPhotos);
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(newPhotos));
      deleteFromCloudSub('memories', key);
  };

  // Export / Import
  const exportData = () => {
    const data: Record<string, any> = {
      [STORAGE_KEYS.ITINERARY]: itinerary,
      [STORAGE_KEYS.BOOKINGS]: bookings,
      [STORAGE_KEYS.GUIDES]: guideSpots,
      [STORAGE_KEYS.PACKING]: packingList,
      [STORAGE_KEYS.MEMO]: memoList,
      [STORAGE_KEYS.WISH]: wishList,
      [STORAGE_KEYS.PHOTOS]: photos
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokyo_trip_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (jsonString: string): boolean => {
      try {
          const data = JSON.parse(jsonString);
          
          if (data[STORAGE_KEYS.ITINERARY]) setItinerary(data[STORAGE_KEYS.ITINERARY]);
          
          // For subcollection items, we update local state.
          // If connected to cloud, we should ideally trigger writes for all of them,
          // but that might be heavy. For now, import updates LOCAL state primarily.
          // If user wants to sync imported data to cloud, they'd effectively need to "touch" items or we'd need a batch upload feature.
          if (data[STORAGE_KEYS.BOOKINGS]) setBookingsState(data[STORAGE_KEYS.BOOKINGS]);
          if (data[STORAGE_KEYS.GUIDES]) setGuideSpotsState(data[STORAGE_KEYS.GUIDES]);
          if (data[STORAGE_KEYS.PHOTOS]) setPhotosState(data[STORAGE_KEYS.PHOTOS]);
          
          if (data[STORAGE_KEYS.PACKING]) setPackingList(data[STORAGE_KEYS.PACKING]);
          if (data[STORAGE_KEYS.MEMO]) setMemoList(data[STORAGE_KEYS.MEMO]);
          if (data[STORAGE_KEYS.WISH]) setWishList(data[STORAGE_KEYS.WISH]);
          
          // Save all to local
          Object.keys(data).forEach(k => {
              localStorage.setItem(k, JSON.stringify(data[k]));
          });
          
          return true;
      } catch (e) {
          console.error("Import Error:", e);
          return false;
      }
  };

  // Initialization
  useEffect(() => {
    const initData = async () => {
      // Load Local Storage
      try {
          const localItinerary = localStorage.getItem(STORAGE_KEYS.ITINERARY);
          if (localItinerary) setItineraryState(JSON.parse(localItinerary));

          const localBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
          if (localBookings) setBookingsState(JSON.parse(localBookings));

          const localGuides = localStorage.getItem(STORAGE_KEYS.GUIDES);
          if (localGuides) setGuideSpotsState(JSON.parse(localGuides));

          const localPacking = localStorage.getItem(STORAGE_KEYS.PACKING);
          if (localPacking) setPackingListState(JSON.parse(localPacking));
          
          const localMemo = localStorage.getItem(STORAGE_KEYS.MEMO);
          if (localMemo) setMemoListState(JSON.parse(localMemo));
          
          const localWish = localStorage.getItem(STORAGE_KEYS.WISH);
          if (localWish) setWishListState(JSON.parse(localWish));

          const localPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
          if (localPhotos) setPhotosState(JSON.parse(localPhotos));
      } catch (e) {
          console.error("Failed to load local data", e);
      }

      // Auto Connect Cloud
      if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("請填入")) {
          await connectToCloud(FIREBASE_CONFIG);
      } else {
          const storedConfig = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
          if (storedConfig) {
             try {
                await connectToCloud(JSON.parse(storedConfig));
             } catch { /* ignore */ }
          }
      }
      setIsLoading(false);
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TripContext.Provider value={{
      itinerary, setItinerary, updateItineraryItem,
      bookings, setBookings, addBooking, deleteBooking, updateBookingPhoto,
      guideSpots, addGuideSpot, deleteGuideSpot, updateGuideSpot,
      packingList, setPackingList, togglePackingItem,
      memoList, setMemoList, addMemoItem, deleteMemoItem, toggleMemoItem,
      wishList, setWishList, addWishItem, deleteWishItem, toggleWishItem,
      photos, uploadPhoto, removePhoto,
      exportData, importData, isLoading, error,
      isCloudMode, cloudConfig, connectToCloud, disconnectCloud, connectionStatus
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
};
