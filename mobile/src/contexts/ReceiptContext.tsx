import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, storage } from '../services/firebase';
import { Receipt, ReceiptContextType } from '../types';
import { useAuth } from './AuthContext';

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const useReceipts = () => {
  const context = useContext(ReceiptContext);
  if (!context) {
    throw new Error('useReceipts must be used within a ReceiptProvider');
  }
  return context;
};

interface ReceiptProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = '@receipts_offline';

export const ReceiptProvider: React.FC<ReceiptProviderProps> = ({ children }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load offline receipts on mount
  useEffect(() => {
    loadOfflineReceipts();
  }, []);



  // Listen to Firestore changes when user is logged in
  useEffect(() => {
    if (!user) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'receipts'), where('userId', '==', user.id));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const receiptData: Receipt[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        receiptData.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Receipt);
      });

      setReceipts(receiptData);
      setLoading(false);

      // Save to offline storage
      await saveOfflineReceipts(receiptData);
    });

    return () => unsubscribe();
  }, [user]);

  const loadOfflineReceipts = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const offlineReceipts = JSON.parse(data);
        setReceipts(offlineReceipts);
      }
    } catch (error) {
      console.error('Error loading offline receipts:', error);
    }
  };

  const saveOfflineReceipts = async (receiptsData: Receipt[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(receiptsData));
    } catch (error) {
      console.error('Error saving offline receipts:', error);
    }
  };

  const uploadImage = async (uri: string, receiptId: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `receipts/${user?.id}/${receiptId}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const addReceipt = async (
    receiptData: Omit<Receipt, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newReceipt = {
        ...receiptData,
        userId: user.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isSynced: true,
      };

      const docRef = await addDoc(collection(db, 'receipts'), newReceipt);

      // Upload image if exists
      if (receiptData.localImageUri) {
        const imageUrl = await uploadImage(receiptData.localImageUri, docRef.id);
        await updateDoc(doc(db, 'receipts', docRef.id), { imageUrl });
      }
    } catch (error) {
      console.error('Error adding receipt:', error);

      // Save to offline storage if online sync fails
      const offlineReceipt: Receipt = {
        id: `offline_${Date.now()}`,
        ...receiptData,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSynced: false,
      };

      const updatedReceipts = [...receipts, offlineReceipt];
      setReceipts(updatedReceipts);
      await saveOfflineReceipts(updatedReceipts);

      throw error;
    }
  };

  const updateReceipt = async (id: string, receiptData: Partial<Receipt>) => {
    try {
      await updateDoc(doc(db, 'receipts', id), {
        ...receiptData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating receipt:', error);
      throw error;
    }
  };

  const deleteReceipt = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'receipts', id));
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  };

  const syncReceipts = async () => {
    if (!user) return;

    try {
      const unsyncedReceipts = receipts.filter((r) => !r.isSynced);

      for (const receipt of unsyncedReceipts) {
        const { id, ...receiptData } = receipt;
        await addDoc(collection(db, 'receipts'), {
          ...receiptData,
          userId: user.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isSynced: true,
        });
      }

      // Remove offline receipts after sync
      const syncedReceipts = receipts.filter((r) => r.isSynced);
      setReceipts(syncedReceipts);
      await saveOfflineReceipts(syncedReceipts);
    } catch (error) {
      console.error('Error syncing receipts:', error);
      throw error;
    }
  };

  const value: ReceiptContextType = {
    receipts,
    loading,
    addReceipt,
    updateReceipt,
    deleteReceipt,
    syncReceipts,
  };

  return <ReceiptContext.Provider value={value}>{children}</ReceiptContext.Provider>;
};
