import { AuthLogo } from "./AuthLogo";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 justify-center bg-white px-4 py-8">
      <div className="mt-20 h-fit w-full max-w-[440px] rounded-xl border-[1.5px] border-primary bg-white p-10">
        <AuthLogo />
        {(title ?? subtitle) && (
          <div className="mt-4 text-center">
            {title && <h1 className="text-lg font-bold text-black">{title}</h1>}
            {subtitle && <p className="mt-1 text-[13px] text-primary-mid">{subtitle}</p>}
          </div>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
