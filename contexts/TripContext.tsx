import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { DaySchedule, BookingItem, PackingItem, ItineraryItem, GuideLocation } from '../types';
import { ITINERARY, INITIAL_BOOKINGS, PACKING_LIST_INITIAL, GUIDE_SPOTS, FIREBASE_CONFIG } from '../constants';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, Firestore, updateDoc } from 'firebase/firestore';

// --- Local Storage Keys ---
const STORAGE_KEYS = {
  ITINERARY: 'trip_itinerary',
  BOOKINGS: 'trip_bookings',
  GUIDES: 'trip_guides',
  PACKING: 'trip_packing_list',
  MEMO: 'trip_memo_list',
  WISH: 'trip_wish_list',
  PHOTOS: 'trip_photos',
  FIREBASE_CONFIG: 'trip_firebase_config' // Save config to stay logged in
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

  // --- Data State ---
  const [itinerary, setItineraryState] = useState<DaySchedule[]>(ITINERARY);
  const [bookings, setBookingsState] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [guideSpots, setGuideSpotsState] = useState<GuideLocation[]>(GUIDE_SPOTS);
  const [packingList, setPackingListState] = useState<PackingItem[]>(PACKING_LIST_INITIAL.map(t => ({ id: t, text: t, checked: false })));
  const [memoList, setMemoListState] = useState<PackingItem[]>([]);
  const [wishList, setWishListState] = useState<PackingItem[]>([]);
  const [photos, setPhotosState] = useState<Record<string, string>>({});

  // --- Cloud Logic ---
  const connectToCloud = async (config: FirebaseConfig) => {
      // Prevent multiple connection attempts
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') return;

      setConnectionStatus('connecting');
      try {
          // Initialize Firebase
          const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
          const db = getFirestore(app);
          
          appRef.current = app;
          dbRef.current = db;

          // Set up Real-time Listener
          const docRef = doc(db, 'trips', CLOUD_DOC_ID);
          
          const unsubscribe = onSnapshot(docRef, (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 // Merge cloud data to local state
                 if (data.itinerary) setItineraryState(data.itinerary);
                 if (data.bookings) setBookingsState(data.bookings);
                 if (data.guideSpots) setGuideSpotsState(data.guideSpots);
                 if (data.packingList) setPackingListState(data.packingList);
                 if (data.memoList) setMemoListState(data.memoList);
                 if (data.wishList) setWishListState(data.wishList);
                 if (data.photos) setPhotosState(data.photos);
             } else {
                 // If doc doesn't exist, create it with current local data
                 setDoc(docRef, {
                    itinerary, bookings, guideSpots, packingList, memoList, wishList, photos
                 });
             }
             setConnectionStatus('connected');
             setIsCloudMode(true);
             setCloudConfig(config);
             localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
          }, (err) => {
              console.error("Firebase Snapshot Error:", err);
              setConnectionStatus('error');
              setError("雲端同步中斷");
          });

          unsubscribeRef.current = unsubscribe;

      } catch (e: any) {
          console.error("Firebase Connection Error:", e);
          setConnectionStatus('error');
          setError("無法連線到雲端資料庫");
          // Don't re-throw here to avoid crashing the app init
      }
  };

  const disconnectCloud = () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      setIsCloudMode(false);
      setConnectionStatus('disconnected');
      setCloudConfig(null);
      localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
      // Reload page to clear firebase instances cleanly
      window.location.reload();
  };

  // --- Initialization ---
  useEffect(() => {
      // 1. Load Local Data first
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

          // 2. Automatic Cloud Connection Logic
          // Check if constants.ts has valid config
          const isHardcodedConfigValid = FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("請填入");
          
          if (isHardcodedConfigValid) {
              console.log("Auto-connecting using hardcoded config...");
              connectToCloud(FIREBASE_CONFIG);
          } else {
              // Fallback: Check local storage for manually entered config (Legacy)
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

  // --- Saver Helper ---
  // If in cloud mode, save to Firestore. Always save to LocalStorage as backup.
  const persist = (key: string, data: any, fieldName: string) => {
      // 1. Local Save
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
          console.error("Local Save Error:", e);
      }

      // 2. Cloud Save (if connected)
      if (isCloudMode && dbRef.current && connectionStatus === 'connected') {
          const docRef = doc(dbRef.current, 'trips', CLOUD_DOC_ID);
          // Use updateDoc to patch only the changed field
          updateDoc(docRef, { [fieldName]: data }).catch(err => {
              console.error("Cloud Save Error:", err);
          });
      }
  };

  // --- Actions (Updated to use persist) ---

  // Itinerary
  const setItinerary = (data: DaySchedule[]) => {
    setItineraryState(data); 
    persist(STORAGE_KEYS.ITINERARY, data, 'itinerary');
  };

  const updateItineraryItem = (dayIndex: number, items: ItineraryItem[]) => {
    const newData = [...itinerary];
    newData[dayIndex] = { ...newData[dayIndex], items: items };
    setItinerary(newData);
  };

  // Bookings
  const setBookings = (data: BookingItem[]) => {
    setBookingsState(data);
    persist(STORAGE_KEYS.BOOKINGS, data, 'bookings');
  };

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

  // Guide Spots
  const setGuideSpots = (data: GuideLocation[]) => {
      setGuideSpotsState(data);
      persist(STORAGE_KEYS.GUIDES, data, 'guideSpots');
  };

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

  // Lists
  const setPackingList = (data: PackingItem[]) => {
    setPackingListState(data);
    persist(STORAGE_KEYS.PACKING, data, 'packingList');
  };

  const togglePackingItem = (id: string) => {
    const newData = packingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    setPackingList(newData);
  };

  const setMemoList = (data: PackingItem[]) => {
    setMemoListState(data);
    persist(STORAGE_KEYS.MEMO, data, 'memoList');
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
    persist(STORAGE_KEYS.WISH, data, 'wishList');
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

  // Photos (Plan View)
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

  // Export / Import (Local based)
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
      if (typeof data !== 'object') return false;

      // When importing, we set states which triggers persist()
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
      console.error(e);
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
      
      // Cloud
      isCloudMode, cloudConfig, connectToCloud, disconnectCloud, connectionStatus
    }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTripContext = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
};