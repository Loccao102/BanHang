import { ReactNode, Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = {
  title: "LSOUL Admin Console — Quản trị hệ thống",
  description: "Bảng điều khiển quản trị hệ thống thương mại điện tử thời trang LSOUL."
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="antAdminApp">
      <Suspense fallback={<div className="antAdminHeaderSkeleton" />}>
        <AdminNav />
      </Suspense>
      <main className="antAdminMain">{children}</main>
    </div>
  );
}
