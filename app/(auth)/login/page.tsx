// TODO: PR #3 - Authentication System
// Login page
// - Email/password form
// - Anonymous login button
// - Display name input

import LoginForm from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
}

