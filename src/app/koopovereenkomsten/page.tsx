'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';

interface Koopovereenkomst {
  id: string;
  naam: string;
  createdAt: string;
}

export default function KoopovereenkomstenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [koopovereenkomsten, setKoopovereenkomsten] = useState<Koopovereenkomst[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchKoopovereenkomsten();
    }
  }, [session]);

  const fetchKoopovereenkomsten = async () => {
    try {
      const response = await fetch('/api/koopovereenkomsten');
      if (!response.ok) throw new Error('Failed to fetch koopovereenkomsten');
      const data = await response.json();
      setKoopovereenkomsten(data);
    } catch (error) {
      console.error('Error fetching koopovereenkomsten:', error);
      setError('Er is een fout opgetreden bij het ophalen van de koopovereenkomsten');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64String.split(',')[1];

        const response = await fetch('/api/koopovereenkomsten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            naam: file.name,
            pdfBase64: base64Content,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload koopovereenkomst');
        }

        await fetchKoopovereenkomsten();
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading koopovereenkomst:', error);
      setError('Er is een fout opgetreden bij het uploaden van de koopovereenkomst');
    } finally {
      setIsUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Terug naar dashboard
            </button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Koopovereenkomsten</h1>
            <p className="text-gray-600 mb-6">
              Hier kun je al je koopovereenkomsten beheren binnen het Hyperautomation Platform. Je kunt nieuwe overeenkomsten aanmaken, bestaande bekijken of wijzigen.
            </p>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Recente overeenkomsten</h2>
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                  Nieuwe overeenkomst
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {isUploading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-600">Bezig met uploaden...</p>
                </div>
              )}

              {koopovereenkomsten.length === 0 ? (
                <div className="bg-gray-50 rounded-md p-4 text-center">
                  <p className="text-gray-500">Nog geen overeenkomsten beschikbaar.</p>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {koopovereenkomsten.map((koopovereenkomst) => (
                      <li key={koopovereenkomst.id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {koopovereenkomst.naam}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {new Date(koopovereenkomst.createdAt).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 