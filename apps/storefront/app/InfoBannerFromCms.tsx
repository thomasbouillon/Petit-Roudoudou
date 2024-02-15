import InfoBanner from 'libs/ui/src/lib/InfoBanner';
import { Home, fetchFromCMS } from '../directus';

export default async function InfoBannerFromCms() {
  const home = await fetchFromCMS<Home>('home', { fields: '*.*.*' });
  return <InfoBanner infos={home.banner_infos.map((info) => info.text)} />;
}
