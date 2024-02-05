//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const { envsafe, str } = require('envsafe');

const buildEnv = envsafe({
  NEXT_IMAGE_DOMAINS: str(),
});

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: true,
  },
  headers: async () => {
    return [
      {
        // CMS based pages
        source: '/(.{0}|evenements|partenaires|foire-aux-questions)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Shop pages
        source: '/boutique((?!/sitemap.xml$).*$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=604800',
          },
          {
            key: 'Test-Header',
            value: 'test-value',
          },
        ],
      },
      {
        // Static pages
        source: '/(nous-contacter|connexion|inscription)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: buildEnv.NEXT_IMAGE_DOMAINS.split(',').map((hostname) => ({
      hostname,
    })),
  },
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
