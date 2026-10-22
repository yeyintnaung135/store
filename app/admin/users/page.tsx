"use client";

import { useMemo, useState } from "react";

type UserRole = "Admin" | "Customer";
type UserStatus = "Active" | "Inactive";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  address: string;
  orders: number;
  totalSpent: number;
};

const initialUsers: User[] = [
  {
    id: "USR-001",
    name: "Mg Mg",
    email: "mgmg@example.com",
    phone: "09-123456789",
    role: "Admin",
    status: "Active",
    joinedAt: "2026-10-01",
    address: "Yangon, Myanmar",
    orders: 12,
    totalSpent: 850000,
  },
  {
    id: "USR-002",
    name: "Aye Aye",
    email: "ayeaye@example.com",
    phone: "09-234567891",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-03",
    address: "Mandalay, Myanmar",
    orders: 8,
    totalSpent: 420000,
  },
  {
    id: "USR-003",
    name: "Ko Ko",
    email: "koko@example.com",
    phone: "09-345678912",
    role: "Customer",
    status: "Inactive",
    joinedAt: "2026-10-04",
    address: "Naypyidaw, Myanmar",
    orders: 3,
    totalSpent: 150000,
  },
  {
    id: "USR-004",
    name: "Su Su",
    email: "susu@example.com",
    phone: "09-456789123",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-05",
    address: "Yangon, Myanmar",
    orders: 15,
    totalSpent: 1200000,
  },
  {
    id: "USR-005",
    name: "Hla Hla",
    email: "hlahla@example.com",
    phone: "09-567891234",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-07",
    address: "Bago, Myanmar",
    orders: 5,
    totalSpent: 275000,
  },
  {
    id: "USR-006",
    name: "Aung Aung",
    email: "aungaung@example.com",
    phone: "09-678912345",
    role: "Admin",
    status: "Active",
    joinedAt: "2026-10-08",
    address: "Taunggyi, Myanmar",
    orders: 0,
    totalSpent: 0,
  },
  {
    id: "USR-007",
    name: "Mya Mya",
    email: "myamya@example.com",
    phone: "09-789123456",
    role: "Customer",
    status: "Inactive",
    joinedAt: "2026-10-09",
    address: "Mawlamyine, Myanmar",
    orders: 2,
    totalSpent: 95000,
  },
  {
    id: "USR-008",
    name: "Kyaw Kyaw",
    email: "kyawkyaw@example.com",
    phone: "09-891234567",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-10",
    address: "Pathein, Myanmar",
    orders: 6,
    totalSpent: 340000,
  },
  {
    id: "USR-009",
    name: "Nandar",
    email: "nandar@example.com",
    phone: "09-912345678",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-11",
    address: "Yangon, Myanmar",
    orders: 4,
    totalSpent: 180000,
  },
  {
    id: "USR-010",
    name: "Thant Zin",
    email: "thantzin@example.com",
    phone: "09-112233445",
    role: "Customer",
    status: "Inactive",
    joinedAt: "2026-10-12",
    address: "Mandalay, Myanmar",
    orders: 1,
    totalSpent: 45000,
  },
  {
    id: "USR-011",
    name: "Ei Ei",
    email: "eiei@example.com",
    phone: "09-223344556",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-13",
    address: "Pyin Oo Lwin, Myanmar",
    orders: 9,
    totalSpent: 560000,
  },
  {
    id: "USR-012",
    name: "Min Min",
    email: "minmin@example.com",
    phone: "09-334455667",
    role: "Customer",
    status: "Active",
    joinedAt: "2026-10-14",
    address: "Taunggyi, Myanmar",
    orders: 7,
    totalSpent: 390000,
  },
];

const PAGE_SIZE = 5;

function formatMMK(amount: number) {
  return `${amount.toLocaleString("en-US")} MMK`;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const styles =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : "bg-gray-100 text-gray-600 ring-gray-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          status === "Active" ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        role === "Admin"
          ? "bg-violet-50 text-violet-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {role}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.id.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "All Roles" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "All Statuses" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);

  const pageUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const activeCount = users.filter((user) => user.status === "Active").length;

  const inactiveCount = users.length - activeCount;

  const adminCount = users.filter((user) => user.role === "Admin").length;

  function toggleUserStatus(userId: string) {
    const updatedUsers = users.map((user) =>
      user.id === userId
        ? {
            ...user,
            status: user.status === "Active" ? "Inactive" : "Active",
          }
        : user,
    );

    setUsers(updatedUsers as User[]);

    setSelectedUser((current: User | null): User | null => {
      if (!current || current.id !== userId) {
        return current;
      }

      const updatedUser = updatedUsers.find((user) => user.id === userId);
      return (updatedUser as User) ?? current;
    });
  }

  function resetFilters() {
    setSearch("");
    setRoleFilter("All Roles");
    setStatusFilter("All Statuses");
    setCurrentPage(1);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-gray-500">Admin / Users</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Users Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage customer accounts, roles, and account status.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total Users</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {users.length}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <section
          aria-label="User summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            label="Total Users"
            value={users.length}
            description="All registered accounts"
            icon="♙"
            iconClass="bg-blue-50 text-blue-700"
          />
          <SummaryCard
            label="Active Users"
            value={activeCount}
            description="Accounts currently active"
            icon="✓"
            iconClass="bg-emerald-50 text-emerald-700"
          />
          <SummaryCard
            label="Inactive Users"
            value={inactiveCount}
            description="Accounts deactivated"
            icon="⊘"
            iconClass="bg-amber-50 text-amber-700"
          />
          <SummaryCard
            label="Administrators"
            value={adminCount}
            description="Admin accounts"
            icon="⚙"
            iconClass="bg-violet-50 text-violet-700"
          />
        </section>

        {/* Users table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  All Users
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Search and manage registered accounts.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="relative xl:col-span-2">
                  <label
                    htmlFor="user-search"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Search users
                  </label>
                  <input
                    id="user-search"
                    aria-label="Search users"
                    type="search"
                    placeholder="Search by name, email or user ID..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role-filter"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Role
                  </label>
                  <select
                    id="role-filter"
                    aria-label="Filter by role"
                    value={roleFilter}
                    onChange={(event) => {
                      setRoleFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>All Roles</option>
                    <option>Admin</option>
                    <option>Customer</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="status-filter"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Account Status
                  </label>
                  <select
                    id="status-filter"
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option>All Statuses</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredUsers.length === 0
                      ? 0
                      : (safePage - 1) * PAGE_SIZE + 1}
                    {"–"}
                    {Math.min(safePage * PAGE_SIZE, filteredUsers.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredUsers.length}
                  </span>{" "}
                  users
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    User
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    User ID
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Role
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Joined Date
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-4 text-right font-semibold"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pageUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-gray-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-600">
                      {user.id}
                    </td>

                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                      {user.joinedAt}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`View ${user.id}`}
                          onClick={() => setSelectedUser(user)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          aria-label={`${user.status === "Active" ? "Deactivate" : "Activate"} ${user.id}`}
                          onClick={() => toggleUserStatus(user.id)}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            user.status === "Active"
                              ? "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500/30"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500/30"
                          }`}
                        >
                          {user.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pageUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">
                        ⌕
                      </div>
                      <p className="mt-3 font-semibold text-gray-900">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your search or filter criteria.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                      >
                        Clear Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-gray-500">
              Page{" "}
              <span className="font-semibold text-gray-900">{safePage}</span> of{" "}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    aria-label={`Go to page ${page}`}
                    aria-current={safePage === page ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                      safePage === page
                        ? "bg-gray-900 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safePage === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-200 p-5 sm:p-6">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  User Profile
                </p>
                <h2
                  id="user-details-title"
                  className="mt-1 text-xl font-bold text-gray-900"
                >
                  User Details
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close user details"
                onClick={() => setSelectedUser(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-xl font-bold text-blue-700">
                  {selectedUser.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedUser.name}
                  </h3>
                  <p className="mt-1 break-all text-sm text-gray-500">
                    {selectedUser.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <RoleBadge role={selectedUser.role} />
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="User ID" value={selectedUser.id} />
                <DetailItem label="Phone" value={selectedUser.phone} />
                <DetailItem label="Joined Date" value={selectedUser.joinedAt} />
                <DetailItem label="Address" value={selectedUser.address} />
                <DetailItem
                  label="Total Orders"
                  value={String(selectedUser.orders)}
                />
                <DetailItem
                  label="Total Spent"
                  value={formatMMK(selectedUser.totalSpent)}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>

              <button
                type="button"
                aria-label={`${selectedUser.status === "Active" ? "Deactivate" : "Activate"} ${selectedUser.id}`}
                onClick={() => toggleUserStatus(selectedUser.id)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                  selectedUser.status === "Active"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {selectedUser.status === "Active"
                  ? "Deactivate Account"
                  : "Activate Account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-semibold ${iconClass}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-500">{description}</p>
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}
