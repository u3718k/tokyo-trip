import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { DaySchedule, BookingItem, PackingItem, ItineraryItem, GuideLocation } from '../types';
import { ITINERARY, INITIAL_BOOKINGS, PACKING_LIST_INITIAL, GUIDE_SPOTS, FIREBASE_CONFIG } from '../constants';

// Standard Modular SDK Imports
// @ts-ignore
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
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
const DOC_BOOKINGS = 'tokyo_trip_2025_bookings'; // Bookings
const DOC_PHOTOS = 'tokyo_trip_2025_photos';     // Photos
const DOC_GUIDES_OLD_LEGACY = 'tokyo_trip_2025_guides'; // Old single file (for migration)

// Guide Data Sharding (Split by Day)
// Format: tokyo_trip_2025_guides_{MMDD}
const GUIDE_DOC_PREFIX = 'tokyo_trip_2025_guides_';
const GUIDE_BUCKETS = ['1217', '1218', '1219', '1220', '1221', '1222', 'misc'];

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
  setBookings: (data: BookingItem[]) => void;
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
  
  // Ref to hold partial guide data from different buckets before merging
  const guideChunksRef = useRef<Record<string, GuideLocation[]>>({});
  
  // A ref to block snapshot updates temporarily if we know a write failed
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

  // --- Utility: Get Bucket for Date ---
  const getGuideBucket = (dateStr?: string): string => {
      if (!dateStr) return 'misc';
      // dateStr format: '12/17' or '2025/12/17'
      const clean = dateStr.replace('2025/', '').replace('/', ''); // '1217'
      if (GUIDE_BUCKETS.includes(clean)) return clean;
      return 'misc';
  };

  // --- Cloud Logic ---
  const handleFirestoreError = (err: any) => {
      console.error("Firebase Error:", err);
      if (err.code === 'permission-denied') {
          setError("連線失敗：權限不足");
      } else if (err.code === 'unavailable') {
          setError("連線失敗：網路不穩");
      } else {
          setError(`連線中斷: ${err.message}`);
      }
      setConnectionStatus('error');
  };

  const connectToCloud = async (config: FirebaseConfig) => {
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;

      setConnectionStatus('connecting');
      console.log("Starting Firebase connection...");

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
            console.error("Firebase Init Error:", initErr);
            throw new Error(`初始化失敗: ${initErr.message}`);
          }

          // 2. Initialize Firestore
          const db = getFirestore(app);
          dbRef.current = db;

          const unsubs: (() => void)[] = [];

          // --- Listener 1: Main (Itinerary & Lists) ---
          const mainRef = doc(db, 'trips', DOC_MAIN);
          const unsubMain = onSnapshot(mainRef, async (docSnap) => {
             if (connectionStatus === 'error' && !isCloudMode) return;
             if (ignoreNextSnapshot.current) { ignoreNextSnapshot.current = false; return; }

             if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.itinerary) setItineraryState(data.itinerary);
                 if (data.packingList) setPackingListState(data.packingList);
                 if (data.memoList) setMemoListState(data.memoList);
                 if (data.wishList) setWishListState(data.wishList);
                 
                 // Migration Check (Move heavy items out of MAIN)
                 const updatesToMove: any = {};
                 const updatesToDelete: any = {};
                 let needMainUpdate = false;
                 
                 if (data.bookings) {
                     await setDoc(doc(db, 'trips', DOC_BOOKINGS), { bookings: data.bookings }, { merge: true });
                     updatesToDelete.bookings = deleteField();
                     needMainUpdate = true;
                 }
                 if (data.photos) {
                     await setDoc(doc(db, 'trips', DOC_PHOTOS), { photos: data.photos }, { merge: true });
                     updatesToDelete.photos = deleteField();
                     needMainUpdate = true;
                 }
                 // If old guides are in main
                 if (data.guideSpots) {
                     // Distribute to buckets
                     const oldGuides = data.guideSpots as GuideLocation[];
                     const buckets: Record<string, GuideLocation[]> = {};
                     oldGuides.forEach(g => {
                         const b = getGuideBucket(g.date);
                         if (!buckets[b]) buckets[b] = [];
                         buckets[b].push(g);
                     });
                     // Save to buckets
                     for (const [bKey, items] of Object.entries(buckets)) {
                         await setDoc(doc(db, 'trips', `${GUIDE_DOC_PREFIX}${bKey}`), { guideSpots: items }, { merge: true });
                     }
                     updatesToDelete.guideSpots = deleteField();
                     needMainUpdate = true;
                 }

                 if (needMainUpdate) {
                     console.log("Migrating data from Main...");
                     await updateDoc(mainRef, updatesToDelete);
                 }
                 setError(null);
             } else {
                 setDoc(mainRef, { 
                    itinerary: sanitizeForFirestore(itinerary), 
                    packingList, memoList, wishList 
                 }).catch(err => setError(`建立資料失敗: ${err.message}`));
             }
             setConnectionStatus('connected');
             setIsCloudMode(true);
             setCloudConfig(config);
             localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
          }, handleFirestoreError);
          unsubs.push(unsubMain);

          // --- Listener 2: Bookings ---
          const bookingsRef = doc(db, 'trips', DOC_BOOKINGS);
          const unsubBookings = onSnapshot(bookingsRef, (docSnap) => {
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.bookings) setBookingsState(data.bookings);
              } else {
                  setDoc(bookingsRef, { bookings: sanitizeForFirestore(bookings) }).catch(console.error);
              }
          }, (err) => console.warn("Bookings sync error:", err.message));
          unsubs.push(unsubBookings);

          // --- Listener 3: Photos ---
          const photosRef = doc(db, 'trips', DOC_PHOTOS);
          const unsubPhotos = onSnapshot(photosRef, (docSnap) => {
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.photos) setPhotosState(data.photos);
              } else {
                  setDoc(photosRef, { photos: {} }).catch(console.error);
              }
          }, (err) => console.warn("Photos sync error:", err.message));
          unsubs.push(unsubPhotos);

          // --- Listener 4: Guides (Multi-Bucket Aggregation) ---
          
          // Helper to merge all buckets
          const updateGuideStateFromChunks = () => {
              const allSpots = Object.values(guideChunksRef.current).flat();
              // Sort by date then id to keep consistent order
              allSpots.sort((a, b) => {
                  if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
                  return a.id.localeCompare(b.id);
              });
              setGuideSpotsState(allSpots);
          };

          // 4.1 Listen to Legacy Guide Doc (Migration only)
          const oldGuidesRef = doc(db, 'trips', DOC_GUIDES_OLD_LEGACY);
          const unsubOldGuides = onSnapshot(oldGuidesRef, async (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.guideSpots && data.guideSpots.length > 0) {
                     console.log("Migrating legacy Guide document to daily buckets...");
                     const oldList = data.guideSpots as GuideLocation[];
                     const buckets: Record<string, GuideLocation[]> = {};
                     
                     oldList.forEach(g => {
                         const b = getGuideBucket(g.date);
                         if (!buckets[b]) buckets[b] = [];
                         buckets[b].push(g);
                     });

                     // Write to new buckets
                     for (const [bKey, items] of Object.entries(buckets)) {
                         const bucketRef = doc(db, 'trips', `${GUIDE_DOC_PREFIX}${bKey}`);
                         await setDoc(bucketRef, { guideSpots: items }, { merge: true });
                     }

                     // Delete old doc contents
                     await updateDoc(oldGuidesRef, { guideSpots: deleteField() });
                 }
             } 
          });
          unsubs.push(unsubOldGuides);

          // 4.2 Listen to All Date Buckets
          GUIDE_BUCKETS.forEach(bucketKey => {
             const bucketDocId = `${GUIDE_DOC_PREFIX}${bucketKey}`;
             const bucketRef = doc(db, 'trips', bucketDocId);
             
             const unsubBucket = onSnapshot(bucketRef, (docSnap) => {
                 if (docSnap.exists()) {
                     const data = docSnap.data();
                     // Update local chunk cache
                     guideChunksRef.current[bucketKey] = data.guideSpots || [];
                 } else {
                     // If bucket doesn't exist, we assume empty for this bucket
                     // (Don't create empty docs unnecessarily to save writes, unless saving)
                     guideChunksRef.current[bucketKey] = [];
                 }
                 updateGuideStateFromChunks();
             }, (err) => console.warn(`Guide bucket ${bucketKey} sync error:`, err.message));
             
             unsubs.push(unsubBucket);
          });

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

  // --- Persistence ---
  const persist = async (key: string, data: any, fieldName: string) => {
      // 1. Local
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
          console.error("Local Save Error:", e);
      }

      // 2. Cloud
      if (isCloudMode && dbRef.current && connectionStatus === 'connected') {
          const cleanData = sanitizeForFirestore(data);
          
          try {
              if (fieldName === 'guideSpots') {
                  // Special Handling for Guides: Split by Date
                  const allSpots = cleanData as GuideLocation[];
                  const buckets: Record<string, GuideLocation[]> = {};
                  
                  // Initialize buckets empty
                  GUIDE_BUCKETS.forEach(b => buckets[b] = []);

                  // Distribute
                  allSpots.forEach(spot => {
                      const b = getGuideBucket(spot.date);
                      if (buckets[b]) buckets[b].push(spot);
                      else buckets['misc'].push(spot);
                  });

                  // Write all buckets (using setDoc to overwrite array for that day)
                  const writePromises = Object.entries(buckets).map(([bKey, items]) => {
                       const docRef = doc(dbRef.current!, 'trips', `${GUIDE_DOC_PREFIX}${bKey}`);
                       // If items empty, we still write empty array to clear if needed
                       return setDoc(docRef, { guideSpots: items });
                  });
                  
                  await Promise.all(writePromises);

              } else {
                  // Standard Handling
                  let targetDocId = DOC_MAIN;
                  if (fieldName === 'bookings') targetDocId = DOC_BOOKINGS;
                  else if (fieldName === 'photos') targetDocId = DOC_PHOTOS;
                  
                  const docRef = doc(dbRef.current, 'trips', targetDocId);
                  
                  // For Main doc, protect against jitter
                  if (targetDocId === DOC_MAIN) ignoreNextSnapshot.current = true;
                  
                  await updateDoc(docRef, { [fieldName]: cleanData });
              }

              if (error && error.includes('失敗')) setError(null);

          } catch (err: any) {
              console.error("Cloud Save Error:", err);
              if (fieldName !== 'guideSpots' && fieldName !== 'photos') {
                   // Release lock if failed
                   ignoreNextSnapshot.current = false; 
              }
              
              let msg = "儲存失敗";
              if (err.code === 'resource-exhausted') msg = "儲存空間不足，請刪除部分圖片";
              else if (err.code === 'permission-denied') msg = "無寫入權限";
              else msg = `儲存失敗: ${err.message}`;
              
              setError(msg);
          }
      }
  };

  // --- Initialization ---
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
      // Prioritize Code Config
      if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("請填入")) {
          await connectToCloud(FIREBASE_CONFIG);
      } else {
          // Fallback to stored config
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

  // --- Actions ---
  const setItinerary = (data: DaySchedule[]) => { setItineraryState(data); persist(STORAGE_KEYS.ITINERARY, data, 'itinerary'); };
  
  const updateItineraryItem = (dayIndex: number, items: ItineraryItem[]) => {
    const newData = [...itinerary];
    newData[dayIndex] = { ...newData[dayIndex], items: items };
    setItinerary(newData);
  };

  const setBookings = (data: BookingItem[]) => { setBookingsState(data); persist(STORAGE_KEYS.BOOKINGS, data, 'bookings'); };
  
  const addBooking = (item: BookingItem) => {
    const newData = [...bookings, item];
    setBookings(newData);
  };

  const deleteBooking = (id: string) => {
    const newData = bookings.filter(b => b.id !== id);
    setBookings(newData);
  };

  const updateBookingPhoto = (id: string, base64: string) => {
    const newData = bookings.map(b => b.id === id ? { ...b, imageUrl: base64 } : b);
    setBookings(newData);
  };

  // Guides logic wrapper
  const setGuideSpots = (data: GuideLocation[]) => { setGuideSpotsState(data); persist(STORAGE_KEYS.GUIDES, data, 'guideSpots'); };
  
  const addGuideSpot = (item: GuideLocation) => {
    const newData = [...guideSpots, item];
    setGuideSpots(newData);
  };

  const deleteGuideSpot = (id: string) => {
    const newData = guideSpots.filter(g => g.id !== id);
    setGuideSpots(newData);
  };

  const updateGuideSpot = (item: GuideLocation) => {
    const newData = guideSpots.map(g => g.id === item.id ? item : g);
    setGuideSpots(newData);
  };

  const setPackingList = (data: PackingItem[]) => { setPackingListState(data); persist(STORAGE_KEYS.PACKING, data, 'packingList'); };
  
  const togglePackingItem = (id: string) => {
    const newData = packingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setPackingList(newData);
  };

  const setMemoList = (data: PackingItem[]) => { setMemoListState(data); persist(STORAGE_KEYS.MEMO, data, 'memoList'); };
  
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

  const setWishList = (data: PackingItem[]) => { setWishListState(data); persist(STORAGE_KEYS.WISH, data, 'wishList'); };
  
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

  const uploadPhoto = (key: string, base64: string) => {
      const newPhotos = { ...photos, [key]: base64 };
      setPhotosState(newPhotos);
      persist(STORAGE_KEYS.PHOTOS, newPhotos, 'photos');
  };

  const removePhoto = (key: string) => {
      const newPhotos = { ...photos };
      delete newPhotos[key];
      setPhotosState(newPhotos);
      persist(STORAGE_KEYS.PHOTOS, newPhotos, 'photos');
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
          if (data[STORAGE_KEYS.BOOKINGS]) setBookings(data[STORAGE_KEYS.BOOKINGS]);
          if (data[STORAGE_KEYS.GUIDES]) setGuideSpots(data[STORAGE_KEYS.GUIDES]);
          if (data[STORAGE_KEYS.PACKING]) setPackingList(data[STORAGE_KEYS.PACKING]);
          if (data[STORAGE_KEYS.MEMO]) setMemoList(data[STORAGE_KEYS.MEMO]);
          if (data[STORAGE_KEYS.WISH]) setWishList(data[STORAGE_KEYS.WISH]);
          if (data[STORAGE_KEYS.PHOTOS]) {
              setPhotosState(data[STORAGE_KEYS.PHOTOS]);
              persist(STORAGE_KEYS.PHOTOS, data[STORAGE_KEYS.PHOTOS], 'photos');
          }
          return true;
      } catch (e) {
          console.error("Import Error:", e);
          return false;
      }
  };

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
