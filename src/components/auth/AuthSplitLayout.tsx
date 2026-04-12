import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type AuthSplitLayoutProps = {
  /** Main heading on the form side */
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Marketing panel (desktop) */
  heroTitle: string;
  heroSubtitle: string;
  /** e.g. "Already have an account?" + link */
  authSwitch?: ReactNode;
};

export function AuthSplitLayout({
  title,
  subtitle,
  children,
  heroTitle,
  heroSubtitle,
  authSwitch,
}: AuthSplitLayoutProps): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full bg-[var(--app-background)] font-[family-name:var(--title-3l-font-family)]">
      <div className="flex min-h-screen items-stretch justify-center md:items-center md:p-6 lg:p-8">
        <div className="flex min-h-screen w-full max-w-[1100px] flex-col overflow-hidden bg-white md:min-h-[min(880px,calc(100vh-3rem))] md:max-h-[calc(100vh-3rem)] md:flex-row md:rounded-3xl md:shadow-[0_8px_40px_-12px_rgba(17,17,28,0.08)]">
          {/* Left half: form */}
          <section className="flex min-h-0 w-full shrink-0 flex-col justify-between bg-white md:h-auto md:w-1/2 md:min-w-0 md:max-w-[50%]">
            <div className="flex flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
              <Link
                to="/login"
                className="inline-flex w-fit transition-opacity hover:opacity-80"
              >
                <img
                  src="/Logo-light-bg.svg"
                  alt="Samvaad AI"
                  className="h-9 w-auto max-w-[200px] object-contain object-left"
                />
              </Link>

              <div className="mx-auto mt-10 w-full max-w-[400px] md:mx-0 md:mt-12">
                <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-x-70 sm:text-[32px]">
                  {title}
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-x-70/85">
                  {subtitle}
                </p>
                <div className="mt-8">{children}</div>
                {authSwitch ? (
                  <div className="mt-8 text-center text-sm text-x-70/90 md:text-left">
                    {authSwitch}
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="flex w-full flex-col gap-2 border-t border-stroke/80 px-5 py-6 text-xs text-x-70/80 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-10 lg:px-12">
              <span>Copyright © {year} Samvaad AI</span>
              <button
                type="button"
                className="text-left text-primary-2 hover:underline sm:text-right"
                onClick={(e) => {
                  window.open("https://www.samvaadai.com/privacy", "_blank");
                }}
              >
                Privacy Policy
              </button>
            </footer>
          </section>

          {/* Right half: hero (no card UI — typography only) */}
          <section
            className="relative flex min-h-[260px] w-full shrink-0 flex-col justify-center overflow-hidden md:h-auto md:w-1/2 md:min-w-0 md:max-w-[50%] md:min-h-0"
            aria-label="Welcome"
          >
            <div
              className="absolute inset-0 bg-primary-2"
              style={{
                background:
                  "linear-gradient(145deg, rgb(0, 149, 152) 0%, rgb(0, 118, 121) 48%, rgb(0, 96, 99) 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-black/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
              aria-hidden
            />

            <div className="relative z-[1] flex flex-col justify-center px-8 py-10 md:h-full md:px-10 md:py-12 lg:px-12">
              <h2 className="max-w-lg text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-[32px] lg:leading-tight">
                {heroTitle}
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[rgba(255,255,255,0.8)]">
                {heroSubtitle}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
