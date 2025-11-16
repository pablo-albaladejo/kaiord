import type { ReactNode } from "react";
import { KiroGhostDecoration } from "../../atoms/KiroGhostDecoration";
import { LayoutHeader } from "./LayoutHeader";

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <KiroGhostDecoration />
      <LayoutHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};
