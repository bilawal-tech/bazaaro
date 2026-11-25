// Loading skeletons: spinner ki jagah wahi shakal ke khali boxes jo load hote hi bhar jate hain.
// Sab ek hi animate-pulse block par bante hain; screen reader ko sirf ek "Loading" sunai deta hai.

import { HOME_GRID } from '../products/productGrid';

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-line ${className}`} />;
}

// ProductCard jaisi hi shakal (image, 2 line naam, price, button), taake load hone par jagah na hile
export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col p-3">
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="mt-2 h-3.5 w-2/3" />
        <Skeleton className="mt-5 h-5 w-1/3" />
        <Skeleton className="mt-2.5 h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

// className mein wahi grid classes dein jo asli grid mein hain
export function ProductGridSkeleton({ count = 8, className = HOME_GRID }) {
  return (
    <div className={className} role="status" aria-label="Loading products">
      <span className="sr-only">Loading products</span>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="container-page py-8 sm:py-12" role="status" aria-label="Loading product">
      <span className="sr-only">Loading product</span>
      <Skeleton className="mb-6 h-4 w-24" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
        <div>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-6 h-8 w-40" />
          <Skeleton className="mt-6 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className="mt-8 flex gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="mt-8 h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="bg-surface" role="status" aria-label="Loading cart">
      <span className="sr-only">Loading cart</span>
      <div className="container-page py-8 sm:py-12">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="mb-8 h-4 w-20" />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="card divide-y divide-line lg:col-span-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 p-5">
                <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/4" />
                  <Skeleton className="mt-5 h-8 w-28 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <div className="card p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-6 h-4 w-full" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-6 h-6 w-full" />
            <Skeleton className="mt-6 h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className="bg-surface" role="status" aria-label="Loading orders">
      <span className="sr-only">Loading orders</span>
      <div className="container-page max-w-4xl py-8 sm:py-12">
        <Skeleton className="mb-2 h-8 w-36" />
        <Skeleton className="mb-8 h-4 w-52" />
        <div className="flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
                <div className="flex gap-8">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-4 p-5">
                <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-1/4" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
