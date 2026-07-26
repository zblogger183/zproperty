export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p className="text-xs font-medium text-black" role="alert">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  );
}
