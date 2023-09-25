import { Article } from '@/types/Article';
import Image from 'next/image';
import Link from 'next/link';

const NewsItem = (article: Article) => {
    const { title, description, url, urlToImage } = article;

    return (
        <div className="flex my-2 md:w-fit bg-white rounded-[4px]">
            {urlToImage && (
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    <div className="m-1 relative w-[130px] h-[100px] md:w-[100px] h-[70px]">
                        <Image
                            src={urlToImage}
                            alt="thumname"
                            unoptimized
                            fill
                            style={{ objectFit: 'fill' }}
                            sizes="(max-width:768px) 5vw"
                            className="rounded-[4px]"
                        />
                    </div>
                </Link>
            )}
            <div className="m-2 md:max-w-[300px] text-xs/[13px] font-semibold">
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black"
                >
                    {title}
                </Link>
                <p className="m-0 leading-none mt-2 text-gray-500 leading-4">
                    {description && description.substring(0, 100) + '...'}
                </p>
            </div>
        </div>
    );
};

export default NewsItem;
