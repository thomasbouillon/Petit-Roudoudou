export default function InfoBanner({ infos }: { infos: string[] }) {
  if (!infos.length) return;
  return (
    <div className="overflow-hidden">
      <div className="min-w-[200vw] md:animate-[slide-half-left_60s_linear_infinite] animate-[slide-half-left_30s_linear_infinite] bg-primary-100 text-white font-bold py-2 flex justify-around gap-8">
        {[0, 1].map((i) => infos.map((info) => <p key={info + i}>{info}</p>))}
      </div>
    </div>
  );
}
