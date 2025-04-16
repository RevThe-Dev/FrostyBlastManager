import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AppShellProps {
  children: ReactNode;
  title: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <ScrollArea className="flex-1 p-4 md:p-6 bg-neutral-50">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}
