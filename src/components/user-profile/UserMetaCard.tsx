"use client";
import React from "react";
import { useSession } from "@/lib/auth-client";

export default function UserMetaCard() {
  const { data: session } = useSession();
  
  if (!session) {
    return null;
  }

  return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            User Information
              </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Full Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {session.user.name}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {session.user.email}
              </p>
                  </div>

                  <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Account Status
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Active
              </p>
                  </div>

                  <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Member Since
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(session.user.createdAt).toLocaleDateString()}
              </p>
                  </div>
                </div>
              </div>
            </div>
        </div>
  );
}