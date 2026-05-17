import { fireEvent, render, screen } from '@testing-library/react';
import NewsImage from './NewsImage';

const FALLBACK = '/images/news-placeholder.svg';

describe('NewsImage', () => {
    it('renders given src when it is a valid http(s) URL', () => {
        render(<NewsImage src="https://example.com/x.png" alt="제목" />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', '제목');
        expect(img.getAttribute('src')).toContain('https://example.com/x.png');
    });

    it('falls back to placeholder when src is null', () => {
        render(<NewsImage src={null} alt="제목" />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', '이미지 없음 — 제목');
        expect(img.getAttribute('src')).toContain(FALLBACK);
    });

    it('falls back to placeholder when src is empty or whitespace', () => {
        render(<NewsImage src="   " alt="t" />);
        expect(screen.getByRole('img').getAttribute('src')).toContain(FALLBACK);
    });

    it('falls back to placeholder for non-http(s) protocols', () => {
        render(<NewsImage src="ftp://example.com/x.png" alt="t" />);
        expect(screen.getByRole('img').getAttribute('src')).toContain(FALLBACK);
    });

    it('swaps to placeholder when the image fails to load', () => {
        render(<NewsImage src="https://example.com/broken.png" alt="제목" />);
        const img = screen.getByRole('img');
        fireEvent.error(img);

        const after = screen.getByRole('img');
        expect(after.getAttribute('src')).toContain(FALLBACK);
        expect(after).toHaveAttribute('alt', '이미지 없음 — 제목');
    });

    it('updates rendered image when src prop changes', () => {
        const { rerender } = render(
            <NewsImage src="https://example.com/old.png" alt="제목" />,
        );

        rerender(<NewsImage src="https://example.com/new.png" alt="제목" />);

        expect(screen.getByRole('img').getAttribute('src')).toContain(
            'https://example.com/new.png',
        );
    });

});
