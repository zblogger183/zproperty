export function CNICViewer({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="overflow-hidden rounded-lg border border-secondary">
        <img src={frontUrl} alt="CNIC front" className="w-full object-contain" />
      </div>
      <div className="overflow-hidden rounded-lg border border-secondary">
        <img src={backUrl} alt="CNIC back" className="w-full object-contain" />
      </div>
    </div>
  );
}
