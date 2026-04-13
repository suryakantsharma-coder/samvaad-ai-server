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
    <div className="min-h-screen min-h-[100dvh] w-full bg-[var(--app-background)] font-[family-name:var(--title-3l-font-family)]">
      <div className="flex min-h-screen min-h-[100dvh] w-full items-stretch justify-stretch p-0">
        <div className="flex min-h-screen min-h-[100dvh] w-full flex-1 flex-col overflow-hidden bg-white md:h-screen md:min-h-0 md:flex-row">
          {/* Left half: form */}
          <section className="flex min-h-0 w-full shrink-0 flex-col justify-between bg-white md:h-full md:w-1/2 md:min-w-0 md:max-w-[50%]">
            <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12">
              <div className="flex w-full max-w-[400px] flex-col items-center">
                <Link
                  to="/login"
                  className="inline-flex transition-opacity hover:opacity-80"
                >
                  <img
                    src="/Logo-light-bg.svg"
                    alt="Samvaad AI"
                    className="h-9 w-auto max-w-[200px] object-contain"
                  />
                </Link>

                <h1 className="mt-10 text-center text-[28px] font-semibold leading-tight tracking-tight text-x-70 sm:mt-12 sm:text-[32px]">
                  {title}
                </h1>
                <p className="mt-2 text-center text-[15px] leading-relaxed text-x-70/85">
                  {subtitle}
                </p>
                <div className="mt-8 w-full text-left">{children}</div>
                {authSwitch ? (
                  <div className="mt-8 w-full text-center text-sm text-x-70/90">
                    {authSwitch}
                  </div>
                ) : null}
              </div>
            </div>

            <footer className="flex w-full flex-col items-center justify-between gap-2 border-t border-stroke/80 px-5 py-6 text-center text-xs text-x-70/80 sm:flex-row sm:gap-6 sm:px-8 md:px-10 lg:px-12">
              <span>Copyright © {year} Samvaad AI</span>
              <button
                type="button"
                className="text-primary-2 hover:underline"
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
            className="relative flex min-h-[260px] w-full shrink-0 flex-col justify-center overflow-hidden md:h-full md:w-1/2 md:min-w-0 md:max-w-[50%] md:min-h-0"
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

            <div className="relative z-[1] flex h-full flex-col items-center justify-center px-8 py-10 text-center md:px-10 md:py-12 lg:px-12">
              <h2 className="max-w-lg font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-[34px] lg:leading-tight">
                {heroTitle}
              </h2>
              <p className="mt-4 max-w-md text-[18px] leading-relaxed text-[rgba(255,255,255,0.8)]">
                {heroSubtitle}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
