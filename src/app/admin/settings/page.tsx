'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

interface OrganizationSettings {
  id: string;
  name: string;
  domain: string;
  billingName: string | null;
  billingAddress: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
  billingCountry: string | null;
  billingVATNumber: string | null;
  billingEmail: string | null;
  hasKoopovereenkomstenAccess: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  pendingOrganizationId: string | null;
  pendingOrganization: {
    id: string;
    name: string;
  } | null;
  organization: {
    id: string;
    name: string;
  } | null;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      if (!session.user.isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchSettings();
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/organization-settings');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setError(null);
      const response = await fetch('/api/admin/organization-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }

      setSuccessMessage('Instellingen succesvol bijgewerkt');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUserAction = async (userId: string, action: string, isAdmin?: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, isAdmin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to perform action');
      }

      await fetchUsers();
      setSuccessMessage('Gebruiker succesvol bijgewerkt');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const isBillingComplete = () => {
    if (!settings) return false;
    
    return !!(
      settings.billingName &&
      settings.billingAddress &&
      settings.billingPostalCode &&
      settings.billingCity &&
      settings.billingCountry &&
      settings.billingEmail
    );
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      };
    });
  };

  if (status === 'loading' || loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => {
                fetchSettings();
                fetchUsers();
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Organisatiebeheer</h1>
          
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSettingsSubmit}>
            {/* Billing Information Section */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Facturatie Gegevens</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Vul hier de facturatie gegevens in voor uw organisatie.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="billingName" className="block text-sm font-medium text-gray-700">
                        Bedrijfsnaam
                      </label>
                      <input
                        type="text"
                        name="billingName"
                        id="billingName"
                        value={settings?.billingName || ''}
                        onChange={handleSettingsChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                        Adres
                      </label>
                      <input
                        type="text"
                        name="billingAddress"
                        id="billingAddress"
                        value={settings?.billingAddress || ''}
                        onChange={handleSettingsChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="billingPostalCode" className="block text-sm font-medium text-gray-700">
                        Postcode
                      </label>
                      <input
                        type="text"
                        name="billingPostalCode"
                        id="billingPostalCode"
                        value={settings?.billingPostalCode || ''}
                        onChange={handleSettingsChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-4">
                      <label htmlFor="billingCity" className="block text-sm font-medium text-gray-700">
                        Plaats
                      </label>
                      <input
                        type="text"
                        name="billingCity"
                        id="billingCity"
                        value={settings?.billingCity || ''}
                        onChange={handleSettingsChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="billingCountry" className="block text-sm font-medium text-gray-700">
                        Land
                      </label>
                      <input
                        type="text"
                        name="billingCountry"
                        id="billingCountry"
                        value={settings?.billingCountry || ''}
                        onChange={handleSettingsChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="billingEmail" className="block text-sm font-medium text-gray-700">
                        Facturatie E-mail
                      </label>
                      <input
                        type="email"
                        name="billingEmail"
                        id="billingEmail"
                        value={settings?.billingEmail || ''}
                        onChange={handleSettingsChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Access Section */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mt-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Applicatie Toegang</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Beheer hier welke applicaties beschikbaar zijn voor uw organisatie.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="hasKoopovereenkomstenAccess"
                        id="hasKoopovereenkomstenAccess"
                        checked={settings?.hasKoopovereenkomstenAccess || false}
                        onChange={handleSettingsChange}
                        disabled={!isBillingComplete()}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                          !isBillingComplete() ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <label htmlFor="hasKoopovereenkomstenAccess" className="ml-3">
                        <span className="text-sm font-medium text-gray-700">Koopovereenkomsten</span>
                        <p className="text-sm text-gray-500">Toegang tot het beheren van koopovereenkomsten</p>
                        {!isBillingComplete() && (
                          <p className="text-sm text-red-500 mt-1">
                            Vul eerst alle facturatiegegevens in om deze optie te kunnen activeren
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mt-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Gebruikers Beheren</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Beheer hier de gebruikers van uw organisatie.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <li key={user.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name || user.email}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{user.email}</p>
                              {user.pendingOrganization && (
                                <p className="text-sm text-yellow-600">
                                  Wachtend op goedkeuring voor: {user.pendingOrganization.name}
                                </p>
                              )}
                              {user.organization && (
                                <p className="text-sm text-green-600">
                                  Organisatie: {user.organization.name}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              {user.pendingOrganization && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(user.id, 'approve')}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                  >
                                    Goedkeuren
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(user.id, 'reject')}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                  >
                                    Afwijzen
                                  </button>
                                </>
                              )}
                              {user.organization && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(user.id, 'toggleAdmin', !user.isAdmin)}
                                    className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                                      user.isAdmin
                                        ? 'text-white bg-red-600 hover:bg-red-700'
                                        : 'text-white bg-green-600 hover:bg-green-700'
                                    }`}
                                  >
                                    {user.isAdmin ? 'Admin verwijderen' : 'Admin maken'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUserAction(user.id, 'delete')}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                  >
                                    Verwijderen
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
} 