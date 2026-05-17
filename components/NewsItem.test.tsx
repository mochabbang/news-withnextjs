import { fireEvent, render, screen } from '@testing-library/react';
import NewsItem from './NewsItem';
import { Article } from '@/types/Article';
import { encodeArticleId } from '@/lib/articleId';
import { loadArticleSnapshot } from '@/lib/articleSession';

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

beforeEach(() => {
    sessionStorage.clear();
});

describe('NewsItem', () => {
    it('renders title and description', () => {
        render(<NewsItem {...makeArticle()} />);
        expect(screen.getByText('테스트 기사 제목')).toBeInTheDocument();
        expect(screen.getByText('테스트 기사 설명')).toBeInTheDocument();
    });

    it('renders internal links to /articles/[id] (not external, same tab)', () => {
        const article = makeArticle();
        const id = encodeArticleId(article.url);
        render(<NewsItem {...article} />);

        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
        for (const link of links) {
            expect(link).toHaveAttribute('href', `/articles/${id}`);
            expect(link).not.toHaveAttribute('target', '_blank');
        }
    });

    it('saves an article snapshot to sessionStorage on click', () => {
        const article = makeArticle();
        const id = encodeArticleId(article.url);
        render(<NewsItem {...article} country="kr" />);

        fireEvent.click(screen.getAllByRole('link')[0]);

        const snap = loadArticleSnapshot(id);
        expect(snap).not.toBeNull();
        expect(snap).toMatchObject({
            url: article.url,
            title: article.title,
            description: article.description,
            sourceName: 'Example News',
            sourceLanguage: 'ko',
        });
    });

    it('encodes sourceLanguage based on country prop', () => {
        const article = makeArticle();
        const id = encodeArticleId(article.url);
        render(<NewsItem {...article} country="cn" />);

        fireEvent.click(screen.getAllByRole('link')[0]);
        expect(loadArticleSnapshot(id)?.sourceLanguage).toBe('zh');
    });

    it('defaults country to "kr" when not provided', () => {
        const article = makeArticle();
        const id = encodeArticleId(article.url);
        render(<NewsItem {...article} />);

        fireEvent.click(screen.getAllByRole('link')[0]);
        expect(loadArticleSnapshot(id)?.sourceLanguage).toBe('ko');
    });

    it('uses article title as image alt when image url is valid', () => {
        render(<NewsItem {...makeArticle()} />);
        expect(screen.getByAltText('테스트 기사 제목')).toBeInTheDocument();
    });

    it('keeps the thumbnail container at the original responsive aspect size', () => {
        render(<NewsItem {...makeArticle()} />);

        expect(screen.getAllByRole('link')[0]).toHaveClass(
            'w-32',
            'sm:w-40',
            'shrink-0',
            'aspect-video',
        );
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
        expect(screen.getAllByText('Same')).toHaveLength(1);
    });

    it('renders a <time> element with the article publishedAt as dateTime attribute', () => {
        render(<NewsItem {...makeArticle()} />);
        const time = document.querySelector('time');
        expect(time).not.toBeNull();
        expect(time).toHaveAttribute('datetime', '2026-04-29T00:00:00Z');
    });
});
