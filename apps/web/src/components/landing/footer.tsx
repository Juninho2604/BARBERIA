import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <Image
          src="/brand/logo-combinado-inverso.svg"
          alt="Brothers Club Barbershop"
          width={1125}
          height={411}
          className="h-10 w-auto opacity-90"
        />
        <div className="flex flex-col items-start gap-1 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] sm:items-end">
          <p>© {new Date().getFullYear()} Brothers Club Barbershop</p>
          <a
            href="/reservar"
            className="text-[color:var(--color-fg)] underline-offset-4 hover:underline"
          >
            Reservar online
          </a>
        </div>
      </div>
    </footer>
  );
}
