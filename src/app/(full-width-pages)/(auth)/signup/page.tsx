"use client";

import SignUpForm from "@/components/auth/SignUpForm";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUp() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (!isPending && session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return <SignUpForm />;
}