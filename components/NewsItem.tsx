import { Article } from '@/types/Article';
import imageLoader from '@/utilities/ImageLoader';
import Image from 'next/image';
import Link from 'next/link';

const NewsItem = (article: Article) => {
    const { title, description, url, urlToImage } = article;

    return (
        <div className="flex mt-10 md:mt-7 md:w-fit">
            {urlToImage && (
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    <div className="mr-1 relative w-[120px] h-[100px]">
                        <Image
                            src={urlToImage}
                            alt="thumname"
                            unoptimized
                            fill
                            style={{ objectFit: 'contain' }}
                            sizes="(max-width:768px) 5vw"
                        />
                    </div>
                </Link>
            )}
            <div className="ml-2 md:mx-2 md:max-w-[300px]">
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black text-base"
                >
                    {title}
                </Link>
                <p className="m-0 leading-none mt-2 text-gray-400 text-xs">
                    {description && description.substring(0, 50) + '...'}
                </p>
            </div>
        </div>
    );
};

export default NewsItem;
