import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
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
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
