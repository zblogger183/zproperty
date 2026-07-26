export interface MediaItem {
  id: string;
  url: string;
  alt: string;
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-text">No media uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.id} className="aspect-square overflow-hidden rounded-md border border-secondary">
          <img src={item.url} alt={item.alt} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
