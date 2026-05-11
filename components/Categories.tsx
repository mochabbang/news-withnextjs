import { cn } from '@/lib/utils';

const categories = [
    { name: 'all', text: '전체' },
    { name: 'business', text: '비즈니스' },
    { name: 'entertainment', text: '엔터테인먼트' },
    { name: 'health', text: '건강' },
    { name: 'science', text: '과학' },
    { name: 'sports', text: '스포츠' },
    { name: 'technology', text: '기술' },
];

interface Props {
    category: string;
    onSelectCategory: (category: string) => void;
}

export default function Categories({ category, onSelectCategory }: Props) {
    return (
        <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            {categories.map((c) => (
                <button
                    key={c.name}
                    type="button"
                    onClick={() => onSelectCategory(c.name)}
                    aria-pressed={category === c.name}
                    className={cn(
                        'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[36px]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        category === c.name
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
                    )}
                >
                    {c.text}
                </button>
            ))}
        </div>
    );
}
