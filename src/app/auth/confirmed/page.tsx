export default function ConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
        <div className="mb-4 text-4xl">&#10003;</div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">
          E-posten är bekräftad!
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Ditt konto är redo. Du kan nu logga in i appen eller på webben.
        </p>
        <a
          href="/login"
          className="inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Logga in
        </a>
      </div>
    </div>
  );
}
