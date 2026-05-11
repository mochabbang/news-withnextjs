import { Globe2 } from 'lucide-react';
import { NEWS_COUNTRIES } from '@/apis/countries';
import { cn } from '@/lib/utils';

interface Props {
    country: string;
    onSelectCountry: (country: string) => void;
    disabled?: boolean;
    className?: string;
}

export default function CountrySelector({
    country,
    onSelectCountry,
    disabled = false,
    className,
}: Props) {
    return (
        <div className={cn('relative w-full sm:w-44', className)}>
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <select
                aria-label="뉴스 국가 선택"
                value={country}
                disabled={disabled}
                onChange={(e) => onSelectCountry(e.target.value)}
                className={cn(
                    'h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                )}
            >
                {NEWS_COUNTRIES.map((option) => (
                    <option key={option.code} value={option.code}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
