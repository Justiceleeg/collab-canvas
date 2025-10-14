import FirebaseTest from "./FirebaseTest";
import RulesTest from "./RulesTest";

export default function Home() {
  return (
    <div className="font-sans flex items-center justify-center min-h-screen p-8">
      <main className="flex flex-col gap-8 items-center max-w-6xl w-full">
        <h1 className="text-4xl font-bold text-center">🧩 Collab Canvas</h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Real-time collaborative canvas - Firebase Setup & Verification
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <FirebaseTest />
          <RulesTest />
        </div>
      </main>
    </div>
  );
}
