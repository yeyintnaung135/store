export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-24 rounded-xl bg-gray-100" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    </main>
  );
}
