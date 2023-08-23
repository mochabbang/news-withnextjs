import { Html, Main, Head, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <link href="/dist/global.css" rel="stylesheet" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
