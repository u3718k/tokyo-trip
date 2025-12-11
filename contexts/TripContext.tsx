import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { DaySchedule, BookingItem, PackingItem, ItineraryItem, GuideLocation } from '../types';
import { ITINERARY, INITIAL_BOOKINGS, PACKING_LIST_INITIAL, GUIDE_SPOTS, FIREBASE_CONFIG } from '../constants';

// Standard Modular SDK Imports (Best for Vite + Firebase v9/v10)
// Using separate type imports to ensure compatibility across different TS configurations
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
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

// Document ID in Firestore
const CLOUD_DOC_ID = 'tokyo_trip_2025_shared';

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
  const appRef = useRef<FirebaseApp | null>(null);
  const dbRef = useRef<Firestore | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
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

  // --- Cloud Logic ---
  const connectToCloud = async (config: FirebaseConfig) => {
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;

      setConnectionStatus('connecting');
      console.log("Starting Firebase connection...");

      try {
          // 1. Initialize App
          let app: FirebaseApp;
          try {
            if (getApps().length === 0) {
              app = initializeApp(config);
            } else {
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

          // 3. Set up Listener
          const docRef = doc(db, 'trips', CLOUD_DOC_ID);
          
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
             if (connectionStatus === 'error' && !isCloudMode) return; // Ignore if previously errored out locally
             
             // Prevent rollback loop
             if (ignoreNextSnapshot.current) {
                 console.log("Ignoring snapshot due to recent write failure");
                 ignoreNextSnapshot.current = false;
                 return;
             }

             if (docSnap.exists()) {
                 const data = docSnap.data();
                 console.log("Data received from cloud");
                 if (data.itinerary) setItineraryState(data.itinerary);
                 if (data.bookings) setBookingsState(data.bookings);
                 if (data.guideSpots) setGuideSpotsState(data.guideSpots);
                 if (data.packingList) setPackingListState(data.packingList);
                 if (data.memoList) setMemoListState(data.memoList);
                 if (data.wishList) setWishListState(data.wishList);
                 if (data.photos) setPhotosState(data.photos);
                 setError(null);
             } else {
                 console.log("Creating new document in cloud...");
                 const cleanItinerary = sanitizeForFirestore(itinerary);
                 const cleanBookings = sanitizeForFirestore(bookings);
                 const cleanGuides = sanitizeForFirestore(guideSpots);
                 
                 setDoc(docRef, {
                    itinerary: cleanItinerary, 
                    bookings: cleanBookings, 
                    guideSpots: cleanGuides, 
                    packingList, memoList, wishList, photos
                 }).catch(err => {
                    console.error("Create Doc Error:", err);
                    setError(`建立資料失敗: ${err.message}`);
                 });
             }
             setConnectionStatus('connected');
             setIsCloudMode(true);
             setCloudConfig(config);
             localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
          }, (err) => {
              console.error("Firebase Snapshot Error:", err);
              // Common Firestore Errors
              if (err.code === 'permission-denied') {
                  setError("連線失敗：權限不足 (Permission Denied)");
              } else if (err.code === 'unavailable') {
                  setError("連線失敗：網路不穩或服務離線");
              } else {
                  setError(`連線中斷: ${err.message}`);
              }
              setConnectionStatus('error');
          });

          unsubscribeRef.current = unsubscribe;

      } catch (e: any) {
          console.error("Firebase Connection Exception:", e);
          setConnectionStatus('error');
          setError(`無法連線: ${e.message}`);
      }
  };

  const disconnectCloud = () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      setIsCloudMode(false);
      setConnectionStatus('disconnected');
      appRef.current = null;
      dbRef.current = null;
  };

  // --- Initialization ---
  useEffect(() => {
      // 1. Load Local Data
      try {
          const load = <T,>(key: string, fallback: T): T => {
              const stored = localStorage.getItem(key);
              return stored ? JSON.parse(stored) : fallback;
          };

          setItineraryState(load(STORAGE_KEYS.ITINERARY, ITINERARY));
          setBookingsState(load(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS));
          setGuideSpotsState(load(STORAGE_KEYS.GUIDES, GUIDE_SPOTS));
          setPackingListState(load(STORAGE_KEYS.PACKING, PACKING_LIST_INITIAL.map(t => ({ id: t, text: t, checked: false }))));
          setMemoListState(load(STORAGE_KEYS.MEMO, []));
          setWishListState(load(STORAGE_KEYS.WISH, []));
          setPhotosState(load(STORAGE_KEYS.PHOTOS, {}));

          // 2. Auto Connect
          const isHardcodedConfigValid = FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("請填入");
          
          if (isHardcodedConfigValid) {
              connectToCloud(FIREBASE_CONFIG);
          } else {
              const savedConfig = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
              if (savedConfig) {
                  const config = JSON.parse(savedConfig);
                  setCloudConfig(config);
                  connectToCloud(config);
              }
          }

      } catch (e) {
          console.error("Initialization Error:", e);
          setError("載入資料失敗");
      } finally {
          setIsLoading(false);
      }
      
      return () => {
          if (unsubscribeRef.current) unsubscribeRef.current();
      };
  }, []);

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
          const docRef = doc(dbRef.current, 'trips', CLOUD_DOC_ID);
          try {
              const cleanData = sanitizeForFirestore(data);
              await updateDoc(docRef, { [fieldName]: cleanData });
              
              if (error && error.includes('失敗')) setError(null);
          } catch (err: any) {
              console.error("Cloud Save Error:", err);
              ignoreNextSnapshot.current = true;
              
              let msg = "儲存失敗";
              if (err.code === 'resource-exhausted') msg = "儲存失敗：資料過大 (圖片限制)";
              else if (err.code === 'permission-denied') msg = "儲存失敗：無寫入權限";
              else msg = `儲存失敗: ${err.message}`;
              
              setError(msg);
          }
      }
  };

  // --- Actions (Pass through) ---
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
