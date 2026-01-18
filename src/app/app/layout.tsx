import Header from "@/components/layout/Header";
import { auth } from "@/lib/auth";
import Providers from "@/lib/providers";
import { redirect } from "next/navigation";
import { FC, PropsWithChildren } from "react";

const AppLayout: FC<PropsWithChildren> = async ({ children }) => {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <Providers>
      <Header session={session} />
      <main className="min-h-screen mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-5">
        {children}
      </main>
      <footer className="bg-primary">
        <div className="w-full max-w-7xl mx-auto px-8 py-4 text-center">
          <p className="text-primary-foreground text-xs">
            © {new Date().getFullYear()} Table Read. All rights reserved.
          </p>
        </div>
      </footer>
    </Providers>
  );
};

export default AppLayout;
