import { Suspense } from "react";
import TopBar from "@/components/TopBar";
import AdminLoginForm from "@/components/AdminLoginForm";

export const metadata = { title: "Admin log in" };

export default function LoginPage() {
  return (
    <main className="page">
      <TopBar label="Admin" />
      <Suspense fallback={null}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
