/**
 * Minimal top bar for unauthenticated public flows (shared prescription link, telecaller booking).
 */
export const PublicBrandHeader = (): JSX.Element => {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-[#dedee1] bg-white/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center px-4 md:px-8">
        <img
          src="/Logo-light-bg.svg"
          alt="Samvaad AI"
          className="h-[48px] w-auto max-w-[200px] object-contain object-left"
        />
      </div>
    </header>
  );
};
