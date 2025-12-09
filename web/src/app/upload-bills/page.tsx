'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import Papa from 'papaparse';
import Sidebar from '@/components/Sidebar';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface BillData {
  email?: string;
  type: string;
  amount: number;
  date: Date;
  description?: string;
  items?: string;
}

export default function UploadBillsPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<BillData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [userMap, setUserMap] = useState<{ [email: string]: string }>({});
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const map: { [email: string]: string } = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email) {
            map[data.email.toLowerCase()] = doc.id;
          }
        });
        setUserMap(map);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
      parseCSV(e.target.files[0]);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data.map((row: any) => {
            if (!row.type || !row.amount || !row.date) {
              throw new Error('Missing required fields (type, amount, date)');
            }
            return {
              email: row.email ? row.email.trim() : undefined,
              type: row.type.toLowerCase().trim(),
              amount: parseFloat(row.amount),
              date: new Date(row.date),
              description: row.description || '',
              items: row.items || ''
            };
          });
          setParsedData(data);
        } catch (error: any) {
          setStatus({ type: 'error', message: 'Error parsing CSV: ' + error.message });
          setParsedData([]);
        }
      },
      error: (error) => {
        setStatus({ type: 'error', message: 'CSV Error: ' + error.message });
      }
    });
  };

  const handleUpload = async () => {
    if (!user || parsedData.length === 0) return;

    setUploading(true);
    setStatus(null);

    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const bill of parsedData) {
        try {
          let targetUserId = user.uid;
          
          if (bill.email) {
            const mappedId = userMap[bill.email.toLowerCase()];
            if (mappedId) {
              targetUserId = mappedId;
            } else {
              throw new Error(`User with email ${bill.email} not found.`);
            }
          }

          const collectionName = `${bill.type}_bills`;
          const validTypes = ['electricity', 'water', 'naturalGas', 'internet', 'gas', 'other'];
          const targetCollection = validTypes.includes(bill.type) ? collectionName : 'other_bills';
          
          await addDoc(collection(db, targetCollection), {
            userId: targetUserId,
            cost: bill.amount,
            date: Timestamp.fromDate(bill.date),
            createdAt: Timestamp.now(),
            description: bill.description,
            items: bill.items,
          });
          successCount++;
        } catch (err: any) {
          console.error('Error uploading bill:', bill, err);
          errors.push(`Row with amount ${bill.amount}: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        setStatus({ 
          type: 'error', 
          message: `Uploaded ${successCount} bills. Failed: ${errors.length}. First error: ${errors[0]}` 
        });
      } else {
        setStatus({ type: 'success', message: `Successfully uploaded ${successCount} bills!` });
        setFile(null);
        setParsedData([]);
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: 'Upload failed: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8 ml-72">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Upload Past Bills</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">1. Prepare your CSV</h2>
            <p className="text-gray-600 mb-2">
              Create a CSV file with the following headers (email is optional, defaults to you):
            </p>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              email,type,amount,date,description,items<br/>
              user@example.com,electricity,150.50,2023-10-01,October Bill,Usage: 120kWh<br/>
              ,water,45.20,2023-10-05,My Water Bill,Usage: 10m3
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Valid types: electricity, water, naturalGas, internet, other.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Select File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-700">Click to upload CSV</span>
                <span className="text-sm text-gray-500 mt-1">or drag and drop here</span>
              </label>
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{file.name}</span>
                <button onClick={() => { setFile(null); setParsedData([]); }} className="ml-auto text-gray-500 hover:text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {parsedData.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">3. Preview ({parsedData.length} bills)</h2>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3 font-medium text-gray-600">Email</th>
                      <th className="p-3 font-medium text-gray-600">Type</th>
                      <th className="p-3 font-medium text-gray-600">Amount</th>
                      <th className="p-3 font-medium text-gray-600">Date</th>
                      <th className="p-3 font-medium text-gray-600">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td className="p-3 text-gray-500">{row.email || '(Me)'}</td>
                        <td className="p-3 capitalize">{row.type}</td>
                        <td className="p-3">₺{row.amount.toFixed(2)}</td>
                        <td className="p-3">{row.date.toLocaleDateString()}</td>
                        <td className="p-3 text-gray-500">{row.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="p-3 text-center text-gray-500 text-sm bg-gray-50 border-t">
                    ...and {parsedData.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          {status && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {status.message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading || parsedData.length === 0 || loadingUsers}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
              !file || uploading || parsedData.length === 0 || loadingUsers
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {uploading ? 'Uploading...' : loadingUsers ? 'Loading Users...' : 'Upload Bills'}
          </button>
        </div>
      </div>
    </div>
  );
}
