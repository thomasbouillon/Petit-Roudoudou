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
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300, stale-while-revalidate=604800',
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

module.exports = composePlugins(...plugins)(nextConfig);
