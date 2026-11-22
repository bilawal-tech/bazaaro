// Order status ke labels aur rang. Backend ki values case-insensitive match hoti hain.
export const STATUS_META = {
  processing: { label: 'Processing', cls: 'bg-blue-100 text-blue-800' },
  shipped:    { label: 'Shipped',    cls: 'bg-amber-100 text-amber-800' },
  delivered:  { label: 'Delivered',  cls: 'bg-brand-100 text-brand-800' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
};

export function getStatusMeta(status) {
  return STATUS_META[status?.toLowerCase()] || STATUS_META.processing;
}
