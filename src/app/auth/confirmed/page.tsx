export default function ConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">
          E-posten är bekräftad!
        </h1>
        <p className="text-sm text-zinc-500">
          Ditt konto är redo. Öppna Vidder-appen och logga in.
        </p>
      </div>
    </div>
  );
}
