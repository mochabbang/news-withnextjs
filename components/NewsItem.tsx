import { Article } from '@/types/Article';
import Image from 'next/image';
import Link from 'next/link';

const NewsItem = (article: Article) => {
    const { title, description, url, urlToImage } = article;

    return (
        <div className="flex mt-12">
            {urlToImage && (
                <div
                    className="mr-1"
                    style={{
                        position: 'relative',
                        minWidth: '260px',
                        minHeight: '160px',
                    }}
                >
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                        <Image
                            src={urlToImage}
                            alt="thumname"
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </Link>
                </div>
            )}
            <div className="ml-2">
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black text-xl font-bold"
                >
                    {title}
                </Link>
                <p className="m-0 leading-none mt-2 whitespace-normal">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default NewsItem;
