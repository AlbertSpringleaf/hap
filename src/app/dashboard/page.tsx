'use client';

import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/AppLayout';

interface AppTile {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const appTiles: AppTile[] = [
  {
    title: 'Koopovereenkomsten',
    description: 'Beheer al je koopovereenkomsten',
    icon: DocumentTextIcon,
    href: '/koopovereenkomsten',
    color: 'bg-blue-500',
  },
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

  return (
    <AppLayout>
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {appTiles.map((tile) => (
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
    </AppLayout>
  );
} 