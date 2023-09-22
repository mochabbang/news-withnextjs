import { Article } from '@/types/Article';
import Image from 'next/image';
import Link from 'next/link';

const NewsItem = (article: Article) => {
    const { title, description, url, urlToImage } = article;

    return (
        <div className="flex mt-10 md:mt-7 md:w-fit">
            {urlToImage && (
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    <div className="mr-1 relative w-[130px] h-[100px] md:w-[100px] h-[70px]">
                        <Image
                            src={urlToImage}
                            alt="thumname"
                            unoptimized
                            fill
                            style={{ objectFit: 'fill' }}
                            sizes="(max-width:768px) 5vw"
                        />
                    </div>
                </Link>
            )}
            <div className="ml-2 md:max-w-[300px] text-xs/[13px]">
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black"
                >
                    {title}
                </Link>
                <p className="m-0 leading-none mt-2 text-gray-400">
                    {description && description.substring(0, 50) + '...'}
                </p>
            </div>
        </div>
    );
};

export default NewsItem;
