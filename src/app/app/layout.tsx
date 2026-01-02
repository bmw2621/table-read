import Providers from "@/lib/providers";
import { FC, PropsWithChildren } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";

const AppLayout: FC<PropsWithChildren> = async ({ children }) => {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  return (
    <Providers>
      <Header session={session} />
      <main>{children}</main>
      <footer className="bg-primary">
        <div className="w-full max-w-7xl mx-auto px-8 py-4 text-center">
          <p className="text-primary-foreground text-xs">
            © 2025 Table Read. All rights reserved.
          </p>
        </div>
      </footer>
    </Providers>
  );
};

export default AppLayout;
