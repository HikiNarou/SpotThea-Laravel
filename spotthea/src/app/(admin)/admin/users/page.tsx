"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";

import { ApiClientError } from "@/lib/api/client";
import { fetchAdminUsers, updateAdminUserRole, type AdminUserItem, type ManagedUserRole } from "@/lib/api/admin-api";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";

const roles: ManagedUserRole[] = ["user", "moderator", "admin"];
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const session = useAppStore((state) => state.session);
  const promoteUser = useAppStore((state) => state.promoteUser);

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const isAdmin = session?.role === "admin";
  const sessionToken = session?.token;

  const loadUsers = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!sessionToken || !isAdmin) {
        return;
      }

      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetchAdminUsers(
          {
            q: deferredQuery,
            page,
            pageSize: PAGE_SIZE,
          },
          sessionToken,
        );

        setUsers(response.items);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setError(null);
      } catch (requestError) {
        if (requestError instanceof ApiClientError) {
          setError(requestError.message);
        } else {
          setError("Gagal memuat user. Coba lagi.");
        }
      } finally {
        if (options?.silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [deferredQuery, isAdmin, page, sessionToken],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!sessionToken || !isAdmin) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadUsers({ silent: true });
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAdmin, loadUsers, sessionToken]);

  const handleRoleChange = async (user: AdminUserItem, nextRole: ManagedUserRole) => {
    if (!sessionToken || !isAdmin || nextRole === user.role) {
      return;
    }

    const previousRole = user.role;
    setUpdatingUserId(user.id);
    setUsers((currentUsers) => currentUsers.map((item) => (item.id === user.id ? { ...item, role: nextRole } : item)));

    try {
      const updated = await updateAdminUserRole(user.id, nextRole, sessionToken);
      setUsers((currentUsers) => currentUsers.map((item) => (item.id === updated.id ? updated : item)));
      promoteUser(updated.id, updated.role);
    } catch (requestError) {
      setUsers((currentUsers) => currentUsers.map((item) => (item.id === user.id ? { ...item, role: previousRole } : item)));
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError("Gagal memperbarui role user.");
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!session) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin untuk mengelola user." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (!isAdmin) {
    return (
      <EmptyState
        title="Akses ditolak"
        description="User Management hanya tersedia untuk role admin."
        ctaHref="/admin"
        ctaLabel="Kembali ke Dashboard"
      />
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-[var(--text-primary)]">User Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Kelola role user, moderator, dan admin langsung dari backend.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadUsers()} isLoading={loading || refreshing}>
          Refresh
        </Button>
      </header>

      <Input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
        placeholder="Cari user/email..."
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                  Memuat data user...
                </td>
              </tr>
            ) : null}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{user.username}</td>
                <td className="px-3 py-2 text-[var(--text-secondary)]">{user.email}</td>
                <td className="px-3 py-2">
                  <Select
                    value={user.role}
                    disabled={updatingUserId === user.id}
                    onChange={(event) => void handleRoleChange(user, event.target.value as ManagedUserRole)}
                    className="h-8 min-w-32 text-xs"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2 text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                  User tidak ditemukan.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          Total user: <span className="font-medium text-[var(--text-primary)]">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
            Prev
          </Button>
          <span className="text-xs text-[var(--text-muted)]">
            Page {page} / {Math.max(totalPages, 1)}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </footer>
    </section>
  );
}
