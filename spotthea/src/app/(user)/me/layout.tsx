import { PageShell } from "@/components/layout/page-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { UserLayoutFrame } from "@/components/layout/user-layout-frame";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PageShell>
        <UserLayoutFrame>{children}</UserLayoutFrame>
      </PageShell>
      <SiteFooter />
    </>
  );
}