export function AuthCopyrightNotice() {
  const year = new Date().getFullYear()

  return (
    <p className="vitis-auth-copyright fixed bottom-5 left-5 z-[60] text-xs text-muted-foreground/80">
      © {year} Vitis. Powered by Adira Finance.
    </p>
  )
}
