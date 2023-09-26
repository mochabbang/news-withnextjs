import { Article } from '@/types/Article';
import Image from 'next/image';
import Link from 'next/link';

const NewsItem = (article: Article) => {
    const { title, description, url, urlToImage, publishedAt } = article;

    return (
        <div className="flex my-2 bg-white rounded-[4px] w-full">
            {urlToImage && (
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    <div className="m-1 relative w-[130px] h-[100px] md:min-w-[100px] h-[70px]">
                        <Image
                            src={urlToImage}
                            alt="thumname"
                            unoptimized
                            fill
                            style={{ objectFit: 'fill' }}
                            className="rounded-[4px]"
                        />
                    </div>
                </Link>
            )}
            <div className="m-2 md:max-w-[300px] text-sm/[13px] md:text-xs/[13px]">
                <div className="font-semibold">
                    <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black"
                    >
                        {title}
                    </Link>
                </div>
                <p className="m-0 leading-none mt-2 text-gray-500 leading-4">
                    {description && description.substring(0, 100) + '...'}
                </p>
                <div className="mt-2 text-xs">게시일 : {publishedAt}</div>
            </div>
        </div>
    );
};

export default NewsItem;
