export default function NewsPlaceholder() {
  return (
    <div className="aspect-[3/2] sm:aspect-[4/1]">
      <p className="sr-only">Chargement des nouveautés</p>
      <div className="placeholder w-full h-full relative after:z-10">
        <div className="z-0 absolute top-1/2 -translate-y-1/2 left-3 bg-primary-100 w-28 aspect-[4/3]"></div>
      </div>
    </div>
  );
}
