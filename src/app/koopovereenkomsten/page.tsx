'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeftIcon, DocumentPlusIcon, DocumentTextIcon, TrashIcon, ClipboardDocumentCheckIcon, CurrencyEuroIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/components/AppLayout';

interface Koopovereenkomst {
  id: string;
  naam: string;
  status: 'geüpload' | 'uitgelezen' | 'uitlezen mislukt' | 'gecontroleerd';
  jsonData?: any;
  pdfBase64: string;
  errorMessage?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function KoopovereenkomstenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [koopovereenkomsten, setKoopovereenkomsten] = useState<Koopovereenkomst[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkAccess();
    }
  }, [status, session, router]);

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/organization-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setHasAccess(data.hasKoopovereenkomstenAccess);
      
      if (!data.hasKoopovereenkomstenAccess) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error checking access:', err);
      setHasAccess(false);
      router.push('/dashboard');
    }
  };

  if (hasAccess === false) {
    return null; // Will redirect to dashboard
  }

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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const file = e.dataTransfer.files[0];
    if (!file) {
      setError('Geen bestand geselecteerd');
      return;
    }

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      setError('Alleen PDF bestanden zijn toegestaan');
      return;
    }

    // Check file size (max 40MB)
    if (file.size > 40 * 1024 * 1024) {
      setError(`Bestand is te groot (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 40MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string;
          if (!base64String) {
            throw new Error('Kon het bestand niet lezen');
          }

          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64Content = base64String.split(',')[1];
          if (!base64Content) {
            throw new Error('Ongeldig PDF bestand');
          }

          console.log('File validation passed:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            base64Length: base64Content.length
          });

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 500);

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

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Upload mislukt: ${response.status} ${response.statusText}`);
          }

          await fetchKoopovereenkomsten();
          
          // Reset upload state after a short delay
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 1000);
        } catch (error) {
          console.error('Error processing file:', error);
          setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het verwerken van het bestand');
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        setError('Er is een fout opgetreden bij het lezen van het bestand');
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading koopovereenkomst:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het uploaden van de koopovereenkomst');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('Geen bestand geselecteerd');
      return;
    }

    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      setError('Alleen PDF bestanden zijn toegestaan');
      return;
    }

    // Check file size (max 40MB)
    if (file.size > 40 * 1024 * 1024) {
      setError(`Bestand is te groot (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 40MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target?.result as string;
          if (!base64String) {
            throw new Error('Kon het bestand niet lezen');
          }

          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64Content = base64String.split(',')[1];
          if (!base64Content) {
            throw new Error('Ongeldig PDF bestand');
          }

          console.log('File validation passed:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            base64Length: base64Content.length
          });

          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 500);

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

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Upload mislukt: ${response.status} ${response.statusText}`);
          }

          await fetchKoopovereenkomsten();
          // Clear the file input
          event.target.value = '';
          
          // Reset upload state after a short delay
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
          }, 1000);
        } catch (error) {
          console.error('Error processing file:', error);
          setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het verwerken van het bestand');
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        setError('Er is een fout opgetreden bij het lezen van het bestand');
        setIsUploading(false);
        setUploadProgress(0);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading koopovereenkomst:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het uploaden van de koopovereenkomst');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleExtractData = async (koopovereenkomstId: string) => {
    setIsExtracting(koopovereenkomstId);
    setError(null);

    try {
      const response = await fetch('/api/koopovereenkomsten/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          koopovereenkomstId,
        }),
      });

      // Just refresh the list to show the updated status
      await fetchKoopovereenkomsten();
    } catch (error) {
      console.error('Error extracting data from koopovereenkomst:', error);
      // Don't show error message, just refresh to show the updated status
      await fetchKoopovereenkomsten();
    } finally {
      setIsExtracting(null);
    }
  };

  const handleDelete = async (koopovereenkomstId: string) => {
    setDeleteConfirmation(koopovereenkomstId);
  };

  const confirmDelete = async (koopovereenkomstId: string) => {
    setIsDeleting(koopovereenkomstId);
    setError(null);
    setDeleteConfirmation(null);

    try {
      const response = await fetch(`/api/koopovereenkomsten/${koopovereenkomstId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete koopovereenkomst');
      }

      await fetchKoopovereenkomsten();
    } catch (error) {
      console.error('Error deleting koopovereenkomst:', error);
      setError(error instanceof Error ? error.message : 'Er is een fout opgetreden bij het verwijderen van de koopovereenkomst');
    } finally {
      setIsDeleting(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  return (
    <AppLayout>
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
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Koopovereenkomsten</h1>
        <p className="text-gray-600 mb-6">
          Hier kun je al je koopovereenkomsten beheren binnen het Hyperautomation Platform. Je kunt nieuwe overeenkomsten toevoegen of controleren.
        </p>
        
        {/* Drag and Drop Upload Area */}
        <div
          className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center">
            <ArrowUpTrayIcon className={`h-12 w-12 mb-4 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Laat het bestand los' : 'Sleep je PDF bestand hierheen'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              of klik op de knop hieronder om een bestand te selecteren
            </p>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              {isUploading ? 'Bezig met uploaden...' : 'Selecteer bestand'}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recente overeenkomsten</h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md relative">
            <button
              onClick={() => setError(null)}
              className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors duration-200"
              aria-label="Sluit foutmelding"
            >
              <XMarkIcon className="h-4 w-4 text-red-500" />
            </button>
            <p className="text-red-600 pr-8">{error}</p>
          </div>
        )}

        {isUploading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <p className="text-blue-600">Bezig met uploaden...</p>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-500 mt-1">{uploadProgress}% voltooid</p>
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-4">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {koopovereenkomst.naam}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {koopovereenkomst.status}
                          </span>
                          <p className="text-xs text-gray-500">
                            Aangemaakt door {koopovereenkomst.user?.name || koopovereenkomst.user?.email || 'Onbekend'} op {new Date(koopovereenkomst.createdAt).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                        {koopovereenkomst.errorMessage && (
                          <div className="mt-2 text-sm text-red-500">
                            <div className="max-w-full overflow-hidden">
                              <pre className="whitespace-pre-wrap break-words bg-red-50 p-2 rounded text-xs max-h-32 overflow-y-auto max-w-[1000px]">
                                {(() => {
                                  try {
                                    const errorObj = JSON.parse(koopovereenkomst.errorMessage || '{}');
                                    return JSON.stringify(errorObj, null, 2).replace(/"/g, '');
                                  } catch (e) {
                                    return koopovereenkomst.errorMessage.replace(/"/g, '');
                                  }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {(koopovereenkomst.status === 'geüpload' || koopovereenkomst.status === 'uitlezen mislukt') && (
                          <button
                            onClick={() => handleExtractData(koopovereenkomst.id)}
                            disabled={isExtracting === koopovereenkomst.id}
                            className="inline-flex items-center w-36 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {isExtracting === koopovereenkomst.id ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                <span className="flex-1 text-center">Uitlezen...</span>
                              </>
                            ) : (
                              <>
                                <DocumentTextIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                                <span className="flex-1 text-center">Uitlezen</span>
                                <span className="ml-1 text-xs bg-white bg-opacity-20 px-1.5 py-0.5 rounded">€</span>
                              </>
                            )}
                          </button>
                        )}
                        {koopovereenkomst.status === 'uitgelezen' && (
                          <button
                            onClick={() => router.push(`/koopovereenkomsten/controleren/${koopovereenkomst.id}`)}
                            disabled={koopovereenkomst.status === 'gecontroleerd' as const}
                            className={`inline-flex items-center w-36 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                              koopovereenkomst.status === 'gecontroleerd' as const
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                          >
                            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                            <span className="flex-1 text-center">Controleren</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(koopovereenkomst.id)}
                          disabled={isDeleting === koopovereenkomst.id}
                          className="inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          title="Verwijderen"
                        >
                          {isDeleting === koopovereenkomst.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Bevestig verwijderen</h3>
                <button 
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700">
                  Weet je zeker dat je deze koopovereenkomst wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => confirmDelete(deleteConfirmation)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 