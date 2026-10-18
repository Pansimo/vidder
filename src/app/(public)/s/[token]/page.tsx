/**
 * K2 beslut 9 (Ulf 2026-10-17/18): länkdelningen är stängd före beta.
 * Sidan anropar inte längre get_shared_story (revokad för anon och
 * authenticated i v126 block 3) — den visar det beslutade beskedet
 * (fix-spec G, Claude Design 2026-10-13). Ingen nedladdningsknapp.
 * /story/[token] omdirigerar hit. Öppnas igen via F-LINK-SHARE-REOPEN
 * (edge-funktion som kontrollerar token, signerar och rensar).
 */
export const metadata = {
  title: 'Vidder',
  robots: { index: false, follow: false },
};

export default function SharedStoryClosedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <p className="text-lg font-semibold text-foreground">
          Den här storyn går inte att visa här just nu.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Öppna Vidder-appen för att se stories som delats med dig.
        </p>
      </div>
    </main>
  );
}
