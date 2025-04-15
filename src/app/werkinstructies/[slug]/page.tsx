'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function WorkInstructionPage({ params }: PageProps) {
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstruction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/werkinstructies/${params.slug}`);
        
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
          setTitle(data.title);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Er is een fout opgetreden bij het ophalen van de werkinstructie');
        }
      } catch (error) {
        console.error('Error fetching instruction:', error);
        setError('Er is een fout opgetreden bij het ophalen van de werkinstructie');
      } finally {
        setLoading(false);
      }
    };

    fetchInstruction();
  }, [params.slug]);

  const handleBack = () => {
    router.push('/werkinstructies');
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
          <div className="flex items-center mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Terug naar overzicht
            </button>
          </div>
          
          {error ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-2xl font-semibold mb-6">{title}</h1>
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-8 mb-4" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-medium mt-6 mb-3" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />,
                    code: ({node, ...props}) => <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-sm" {...props} />,
                    pre: ({node, ...props}) => <pre className="bg-gray-100 rounded p-2 font-mono text-sm overflow-x-auto my-4" {...props} />,
                    hr: ({node, ...props}) => <hr className="my-8 border-t border-gray-200" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 