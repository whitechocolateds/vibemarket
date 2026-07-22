import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import FABQuickActions from '@/components/admin/FABQuickActions';
import Toaster from '@/components/admin/Toaster';
import styles from '../admin.module.css';

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect('/admin/login');

  return (
    <div className={styles.admin}>
      <div className={styles.shell}>
        <AdminSidebar />
        <main className={styles.main}>
          <AdminTopBar />
          {children}
        </main>
      </div>
      <Toaster />
      <FABQuickActions />
    </div>
  );
}
