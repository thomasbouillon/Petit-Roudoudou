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
  images: {
    remotePatterns: buildEnv.NEXT_IMAGE_DOMAINS.split(',').map((hostname) => ({
      hostname,
    })),
  },
  experimental: {
    missingSuspenseWithCSRBailout: false, // TODO
  },
  serverRuntimeConfig: {
    ISR_SECRET: process.env.ISR_SECRET,
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
