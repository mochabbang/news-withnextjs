/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['*'],
        loader: 'default',
        loaderFile: './utilities/ImageLoader.ts',
    },
    reactStrictMode: true,
};

module.exports = nextConfig;
