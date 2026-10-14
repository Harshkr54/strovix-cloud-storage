import { Cloud } from 'lucide-react';

function BrandMark({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3157d5] text-white shadow-xs">
        <Cloud className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="font-[family-name:var(--font-display)] text-xl font-bold leading-none tracking-tight">
        <span className={light ? 'text-white' : 'text-[#111827] dark:text-white'}>Storvix</span>{' '}
        <span className="text-[#3157d5] dark:text-[#5b7cff]">Drive</span>
      </div>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children, footerLink, compactOnMobile = false }) {
  return (
    <div className="flex min-h-dvh w-full overflow-y-auto bg-[#f7f8fa] dark:bg-[#0b0f17] transition-colors duration-150">
      <div className="flex w-full flex-col lg:flex-row">
        {/* Left Branding Panel */}
        <section className="hidden flex-1 flex-col justify-between border-r border-[#e5e7eb] bg-white p-12 dark:border-[#253044] dark:bg-[#111827] lg:flex xl:p-16">
          <div>
            <BrandMark />

            <h2 className="mt-12 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#111827] dark:text-[#f9fafb]">
              Cloud Storage & Workspace —
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#6b7280] dark:text-[#9ca3af]">
              Store, share, and collaborate on your files with end-to-end security, lightning-fast S3 direct uploads, and AI-powered file intelligence.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-[#e5e7eb] pt-8 dark:border-[#253044]">
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#3157d5] dark:text-[#5b7cff]">
                  5 GB
                </p>
                <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">Free Storage</p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#3157d5] dark:text-[#5b7cff]">
                  Fast
                </p>
                <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">S3 Direct Uploads</p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#3157d5] dark:text-[#5b7cff]">
                  99.9%
                </p>
                <p className="mt-1 text-xs text-[#6b7280] dark:text-[#9ca3af]">Reliability</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#9ca3af] dark:text-[#6b7280]">
            © 2026 Storvix Cloud Storage. All rights reserved.
          </p>
        </section>

        {/* Right Form Panel */}
        <section className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="lg:hidden mb-6">
              <BrandMark />
            </div>

            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#111827] dark:text-[#f9fafb] sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1.5 text-xs text-[#6b7280] dark:text-[#9ca3af] sm:text-sm">{subtitle}</p>
            </div>

            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-xs dark:border-[#253044] dark:bg-[#111827] sm:p-8 space-y-4">
              {children}
            </div>

            {footerLink && <div className="text-center text-xs text-[#6b7280] dark:text-[#9ca3af]">{footerLink}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  required,
  readOnly,
  placeholder,
  autoComplete,
  rightSlot,
  error,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[#111827] dark:text-[#f9fafb]">{label}</label>
      <div className="relative">
        <input
          type={type}
          required={required}
          readOnly={readOnly}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-lg border border-[#e5e7eb] bg-[#f7f8fa] px-3.5 py-2.5 text-xs font-medium text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#3157d5] focus:bg-white focus:ring-2 focus:ring-[#3157d5]/15 dark:border-[#253044] dark:bg-[#0b0f17] dark:text-[#f9fafb] dark:placeholder:text-[#6b7280] dark:focus:border-[#5b7cff] sm:text-sm ${
            rightSlot ? 'pr-11' : ''
          } ${error ? 'border-[#dc2626] dark:border-[#dc2626]' : ''}`}
        />
        {rightSlot ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightSlot}</div>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs font-semibold text-[#dc2626] dark:text-red-400">{error}</p> : null}
    </div>
  );
}

export function AuthPrimaryButton({ children, disabled, type = 'submit' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="w-full rounded-lg bg-[#3157d5] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#2649bd] active:scale-98 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer sm:text-sm"
    >
      {children}
    </button>
  );
}
