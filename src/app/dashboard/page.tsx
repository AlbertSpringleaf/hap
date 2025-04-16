'use client';

import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/AppLayout';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface AppTile {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

interface OrganizationSettings {
  hasKoopovereenkomstenAccess: boolean;
}

const applicationTiles: AppTile[] = [
  {
    title: 'Koopovereenkomsten',
    description: 'Beheer al je koopovereenkomsten',
    icon: DocumentTextIcon,
    href: '/koopovereenkomsten',
    color: 'bg-blue-500',
  }
];

const manualTiles: AppTile[] = [
  {
    title: 'Werkinstructies Robots',
    description: 'Bekijk alle werkinstructies voor robots',
    icon: WrenchScrewdriverIcon,
    href: '/werkinstructies',
    color: 'bg-green-500',
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.organizationId) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/organization-settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter application tiles based on organization settings
  const filteredApplicationTiles = applicationTiles.filter(tile => {
    if (tile.href === '/koopovereenkomsten') {
      return settings?.hasKoopovereenkomstenAccess ?? false;
    }
    return true;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h2>
        
        {/* Applications Section */}
        {filteredApplicationTiles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Applicaties</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplicationTiles.map((tile) => (
                <div
                  key={tile.title}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => router.push(tile.href)}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 rounded-md p-3 ${tile.color}`}>
                        <tile.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{tile.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{tile.description}</p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manuals Section */}
        {manualTiles.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Handleidingen</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {manualTiles.map((tile) => (
                <div
                  key={tile.title}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => router.push(tile.href)}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 rounded-md p-3 ${tile.color}`}>
                        <tile.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{tile.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{tile.description}</p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 