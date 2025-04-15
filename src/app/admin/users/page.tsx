"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

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

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !session.user.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, isAdmin?: boolean) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
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
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Gebruikers beheren</h1>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                    <div className="flex items-center space-x-4">
                      {user.pendingOrganization && (
                        <>
                          <button
                            onClick={() => handleAction(user.id, 'approve')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Goedkeuren
                          </button>
                          <button
                            onClick={() => handleAction(user.id, 'reject')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            Afwijzen
                          </button>
                        </>
                      )}
                      {user.id !== session?.user?.id && (
                        <>
                          <button
                            onClick={() => handleAction(user.id, 'toggleAdmin', !user.isAdmin)}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                              user.isAdmin
                                ? 'text-white bg-red-600 hover:bg-red-700'
                                : 'text-white bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {user.isAdmin ? 'Admin verwijderen' : 'Admin maken'}
                          </button>
                          <button
                            onClick={() => handleAction(user.id, 'delete')}
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
    </AppLayout>
  );
} 