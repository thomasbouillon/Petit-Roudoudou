//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone',
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://static.petit-roudoudou.fr' : '',
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false, // TODO
  },
  productionBrowserSourceMaps: process.env.ANALYZE === 'true',
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

if (process.env.ANALYZE === 'true') {
  plugins.push(
    // @ts-ignore
    require('@next/bundle-analyzer')({
      enabled: process.env.ANALYZE === 'true',
    })
  );
}

module.exports = composePlugins(...plugins)(nextConfig);
