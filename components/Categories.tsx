const categories = [
    {
        name: 'all',
        text: '전체보기',
    },
    {
        name: 'business',
        text: '비즈니스',
    },
    {
        name: 'entertainment',
        text: '엔터테인먼트',
    },
    {
        name: 'health',
        text: '건강',
    },
    {
        name: 'science',
        text: '과학',
    },
    {
        name: 'sports',
        text: '스포츠',
    },
    {
        name: 'technology',
        text: '기술',
    },
];

interface Props {
    category: string;
    onSelectCategory: void;
}

const Categories = ({ category }: Props) => {
    const categoryActiveClass =
        'font-semibold border-2 border-solid border-cyan-500 hover:text-cyan-500';

    return (
        <div className="flex p-4 w-[768px] my-0 mx-auto md:w-full overflow-x-auto space-x-4">
            {categories.map((c) => (
                <div
                    className={`text-lg whitespace-pre text-inherit pb-1 hover:text-cyan-500 md:text-base ${
                        category === c.name && categoryActiveClass
                    }`}
                    // onClick={() => onSelectCategory(c.name)}
                    key={c.name}
                >
                    {c.text}
                </div>
            ))}
        </div>
    );
};

export default Categories;
