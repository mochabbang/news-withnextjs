import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
    country?: string;
}

export default function SearchBar({ className, country }: Props) {
    const [q, setQ] = useState('');
    const router = useRouter();

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (q.trim()) {
            const params = new URLSearchParams({ q: q.trim() });
            const selectedCountry =
                country ??
                (typeof router.query.country === 'string'
                    ? router.query.country
                    : undefined);

            if (selectedCountry) params.set('country', selectedCountry);

            router.push(`/search?${params.toString()}`);
            setQ('');
        }
    };

    return (
        <form onSubmit={onSubmit} className={cn('relative', className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="뉴스 검색..."
                className="h-9 pl-9"
            />
        </form>
    );
}
