import Link from 'next/link';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-screen-lg mx-auto flex h-14 items-center gap-3 px-4">
                <Link
                    href="/"
                    className="font-bold text-lg shrink-0 text-foreground hover:text-primary transition-colors"
                >
                    뉴스
                </Link>
                <SearchBar className="flex-1 max-w-sm" />
                <ThemeToggle />
            </div>
        </header>
    );
}
