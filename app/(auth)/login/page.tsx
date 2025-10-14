import LoginForm from "@/components/Auth/LoginForm";
import AuthGuard from "@/components/Auth/AuthGuard";

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoginForm />
      </div>
    </AuthGuard>
  );
}
