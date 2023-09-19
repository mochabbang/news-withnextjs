/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['*'],
        loader: 'custom',
        loaderFile: './utilities/ImageLoader.ts',
    },
    reactStrictMode: true,
};

module.exports = nextConfig;
