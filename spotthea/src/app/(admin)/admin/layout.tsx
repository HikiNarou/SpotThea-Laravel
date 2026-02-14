import { AdminLayoutFrame } from "@/components/layout/admin-layout-frame";
import { PageShell } from "@/components/layout/page-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <AdminLayoutFrame>{children}</AdminLayoutFrame>
      </PageShell>
      <SiteFooter />
    </>
  );
}