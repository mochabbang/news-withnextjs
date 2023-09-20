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
                    <div className="mr-1 relative min-w-[120px] h-[100px] md:min-w-[120px]">
                        <Image
                            src={urlToImage}
                            alt="thumname"
                            fill
                            style={{ objectFit: 'contain' }}
                            sizes="(max-width:768px) 5vw"
                        />
                    </div>
                </Link>
            )}
            <div className="ml-2 md:mx-2 md:truncate md:max-w-[300px]">
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black text-xl font-bold md:text-base"
                >
                    {title}
                </Link>
                <p className="m-0 leading-none mt-2 whitespace-normal text-xs">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default NewsItem;
