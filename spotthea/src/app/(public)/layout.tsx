import { MaintenanceGate } from "@/components/layout/maintenance-gate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MaintenanceGate />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}