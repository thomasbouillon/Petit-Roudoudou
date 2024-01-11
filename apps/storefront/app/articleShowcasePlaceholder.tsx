'use client';

export function ArticleShowcasePlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <p className="sr-only">Chargement des créations à la une.</p>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="flex flex-col relative" key={i}>
          <div className="bg-white rounded-t-sm overflow-hidden">
            <div className="placeholder bg-gray-300 w-full h-full aspect-[380/230]"></div>
          </div>
          <div className="shadow-lg mb-4 bg-white rounded-b-md w-full">
            <div className="flex-grow h-12"></div>
            <div className="placeholder bg-primary-100 w-[80%] mx-auto block text-center mt-auto translate-y-4 py-4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
