'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import KoopovereenkomstViewer from '@/components/KoopovereenkomstViewer';

interface Koopovereenkomst {
  id: string;
  naam: string;
  status: string;
  jsonData: any;
  pdfBase64: string;
  createdAt: string;
}

export default function ControlerenPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [koopovereenkomst, setKoopovereenkomst] = useState<Koopovereenkomst | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchKoopovereenkomst();
    }
  }, [session, params.id]);

  const fetchKoopovereenkomst = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/koopovereenkomsten/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch koopovereenkomst');
      }
      const data = await response.json();
      setKoopovereenkomst(data);
    } catch (error) {
      console.error('Error fetching koopovereenkomst:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het ophalen van de koopovereenkomst');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.push('/koopovereenkomsten')}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Terug naar koopovereenkomsten
              </button>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!koopovereenkomst) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.push('/koopovereenkomsten')}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Terug naar koopovereenkomsten
              </button>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">Koopovereenkomst niet gevonden.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/koopovereenkomsten')}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Terug naar koopovereenkomsten
            </button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Controleren: {koopovereenkomst.naam}
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PDF Viewer */}
              <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">PDF Document</h2>
                <div className="border border-gray-200 rounded-md overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
                  <KoopovereenkomstViewer pdfData={koopovereenkomst.pdfBase64} />
                </div>
              </div>
              
              {/* JSON Data */}
              <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Uitgelezen Data</h2>
                <div className="border border-gray-200 rounded-md overflow-auto" style={{ height: 'calc(100vh - 300px)' }}>
                  <pre className="p-4 text-sm text-gray-800 overflow-auto">
                    {JSON.stringify(koopovereenkomst.jsonData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 