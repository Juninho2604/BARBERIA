export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-[color:var(--color-fg-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Barbería. Todos los derechos reservados.</p>
        <p>
          Hecho con cuidado.{" "}
          <a
            href="/reservar"
            className="text-[color:var(--color-fg)] underline-offset-4 hover:underline"
          >
            Reservar online
          </a>
        </p>
      </div>
    </footer>
  );
}
