import { ReactNode } from 'react';
import Header from './Header';

interface Props {
    children: ReactNode;
}

export default function Layout({ children }: Props) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-screen-lg mx-auto px-4 py-4">{children}</main>
        </div>
    );
}
