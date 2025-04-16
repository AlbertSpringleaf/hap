'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import KoopovereenkomstViewer from '@/components/KoopovereenkomstViewer';
import JsonEditor from '@/components/JsonEditor';
import AppLayout from '@/components/AppLayout';

interface Koopovereenkomst {
  id: string;
  naam: string;
  status: string;
  jsonData: any;
  pdfBase64: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function ControlerenPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [koopovereenkomst, setKoopovereenkomst] = useState<Koopovereenkomst | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchKoopovereenkomst();
    }
  }, [status, params.id]);

  const fetchKoopovereenkomst = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/koopovereenkomsten/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch koopovereenkomst');
      }
      const data = await response.json();
      console.log('Received data from API:', {
        id: data.id,
        naam: data.naam,
        hasPdfBase64: !!data.pdfBase64,
        pdfBase64Length: data.pdfBase64?.length
      });
      setKoopovereenkomst(data);
    } catch (error) {
      console.error('Error fetching koopovereenkomst:', error);
      setError('Er is een fout opgetreden bij het ophalen van de koopovereenkomst');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveJson = async (id: string, jsonData: any) => {
    const response = await fetch(`/api/koopovereenkomsten/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jsonData }),
    });

    if (!response.ok) {
      throw new Error('Failed to save JSON data');
    }

    const updatedData = await response.json();
    setKoopovereenkomst(updatedData);
  };

  const handleProcess = async (id: string, jsonData: any) => {
    const response = await fetch(`/api/koopovereenkomsten/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jsonData, status: 'gecontroleerd' }),
    });

    if (!response.ok) {
      throw new Error('Failed to process koopovereenkomst');
    }

    const updatedData = await response.json();
    setKoopovereenkomst(updatedData);
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/koopovereenkomsten/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete koopovereenkomst');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  if (!koopovereenkomst) {
    return (
      <AppLayout>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
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
          <h1 className="text-2xl font-semibold mb-4">{koopovereenkomst.naam}</h1>
          <div className="mb-4 space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {koopovereenkomst.status}
            </span>
            <p className="text-sm text-gray-500">
              Aangemaakt door {koopovereenkomst.user?.name || koopovereenkomst.user?.email || 'Onbekend'} op {new Date(koopovereenkomst.createdAt).toLocaleDateString('nl-NL')}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PDF Viewer */}
            <div>
              <h2 className="text-lg font-medium mb-4">PDF Document</h2>
              {koopovereenkomst.pdfBase64 && (
                <KoopovereenkomstViewer pdfBase64={koopovereenkomst.pdfBase64} />
              )}
            </div>
            
            {/* JSON Editor */}
            <div>
              <JsonEditor 
                id={koopovereenkomst.id}
                jsonData={koopovereenkomst.jsonData}
                onSave={handleSaveJson}
                onDelete={handleDelete}
                onProcess={koopovereenkomst.status !== 'gecontroleerd' ? handleProcess : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 