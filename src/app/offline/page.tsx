export default function OfflinePage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <h1 className="font-mono text-2xl">You are offline</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          reconnect to sync bookings and events
        </p>
      </div>
    </main>
  );
}
