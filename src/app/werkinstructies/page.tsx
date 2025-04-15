'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface WorkInstruction {
  id: string;
  title: string;
}

export default function WorkInstructionsPage() {
  const router = useRouter();
  const [instructions, setInstructions] = useState<WorkInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/werkinstructies');
        
        if (response.ok) {
          const data = await response.json();
          setInstructions(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Er is een fout opgetreden bij het ophalen van de werkinstructies');
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
        setError('Er is een fout opgetreden bij het ophalen van de werkinstructies');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructions();
  }, []);

  const handleInstructionClick = (instruction: WorkInstruction) => {
    router.push(`/werkinstructies/${instruction.id}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Laden...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Werkinstructies</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {instructions.length === 0 ? (
            <div className="bg-gray-50 rounded-md p-6 text-center">
              <p className="text-gray-500">Er zijn momenteel geen werkinstructies beschikbaar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {instructions.map((instruction) => (
                <div
                  key={instruction.id}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleInstructionClick(instruction)}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md p-3 bg-green-500">
                        <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{instruction.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 