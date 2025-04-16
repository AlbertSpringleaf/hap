'use client';

import { useSession, signOut } from 'next-auth/react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log(window.location.href);
    console.log(window.location.pathname);
    await signOut({ 
      callbackUrl: 'https://hap.springleaf.nl/login',
      redirect: true
    });
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Hyperautomation Platform
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <Menu as="div" className="relative ml-3">
              <div>
                <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span className="sr-only">Open user menu</span>
                  <div className="flex items-center">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-gray-700">{session?.user?.email}</span>
                  </div>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {session?.user?.isAdmin && (
                    <>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => router.push('/admin/settings')}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            Organisatiebeheer
                          </button>
                        )}
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => router.push('/profile')}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                      >
                        Profiel beheren
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleSignOut}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                      >
                        Uitloggen
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
} 