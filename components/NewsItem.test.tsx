import { render, screen } from '@testing-library/react';
import NewsItem from './NewsItem';
import { Article } from '@/types/Article';

function makeArticle(overrides: Partial<Article> = {}): Article {
    return {
        author: '작성자',
        title: '테스트 기사 제목',
        description: '테스트 기사 설명',
        url: 'https://example.com/article',
        urlToImage: 'https://example.com/x.png',
        publishedAt: '2026-04-29T00:00:00Z',
        content: '본문',
        source: { name: 'Example News' },
        ...overrides,
    };
}

describe('NewsItem', () => {
    it('renders title and description', () => {
        render(<NewsItem {...makeArticle()} />);
        expect(screen.getByText('테스트 기사 제목')).toBeInTheDocument();
        expect(screen.getByText('테스트 기사 설명')).toBeInTheDocument();
    });

    it('renders external links with target=_blank and rel="noopener noreferrer"', () => {
        render(<NewsItem {...makeArticle()} />);
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
        for (const link of links) {
            expect(link).toHaveAttribute('href', 'https://example.com/article');
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
            expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
        }
    });

    it('uses article title as image alt when image url is valid', () => {
        render(<NewsItem {...makeArticle()} />);
        expect(screen.getByAltText('테스트 기사 제목')).toBeInTheDocument();
    });

    it('uses fallback image alt when urlToImage is null', () => {
        render(<NewsItem {...makeArticle({ urlToImage: null })} />);
        expect(screen.getByAltText('이미지 없음 — 테스트 기사 제목')).toBeInTheDocument();
    });

    it('shows source name as a badge', () => {
        render(<NewsItem {...makeArticle({ source: { name: '한겨레' } })} />);
        expect(screen.getByText('한겨레')).toBeInTheDocument();
    });

    it('omits description when description is null', () => {
        render(<NewsItem {...makeArticle({ description: null })} />);
        expect(screen.queryByText('테스트 기사 설명')).not.toBeInTheDocument();
    });

    it('shows originalTitle when translated and different from title', () => {
        render(
            <NewsItem
                {...makeArticle({
                    title: '한국어 번역 제목',
                    originalTitle: 'English Original Title',
                    translated: true,
                })}
            />,
        );
        expect(screen.getByText('English Original Title')).toBeInTheDocument();
    });

    it('does not show originalTitle when translated=false', () => {
        render(
            <NewsItem
                {...makeArticle({
                    title: '제목',
                    originalTitle: 'English',
                    translated: false,
                })}
            />,
        );
        expect(screen.queryByText('English')).not.toBeInTheDocument();
    });

    it('does not show originalTitle when it equals title', () => {
        render(
            <NewsItem
                {...makeArticle({
                    title: 'Same',
                    originalTitle: 'Same',
                    translated: true,
                })}
            />,
        );
        // Title rendered once in h3 only, not also as the originalTitle line
        expect(screen.getAllByText('Same')).toHaveLength(1);
    });

    it('renders a <time> element with the article publishedAt as dateTime attribute', () => {
        render(<NewsItem {...makeArticle()} />);
        const time = document.querySelector('time');
        expect(time).not.toBeNull();
        expect(time).toHaveAttribute('datetime', '2026-04-29T00:00:00Z');
    });
});
