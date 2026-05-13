import { render, screen } from '@testing-library/react';
import NewsList from './NewsList';
import { Article } from '@/types/Article';

function makeArticle(overrides: Partial<Article> = {}): Article {
    return {
        author: null,
        title: 'title',
        description: 'desc',
        url: 'https://example.com/a',
        urlToImage: 'https://example.com/i.png',
        publishedAt: '2026-04-29T00:00:00Z',
        content: null,
        source: { name: 'Example' },
        ...overrides,
    };
}

describe('NewsList', () => {
    it('renders one NewsItem per article', () => {
        const articles = [
            makeArticle({ url: 'https://example.com/1', title: '첫 번째 기사' }),
            makeArticle({ url: 'https://example.com/2', title: '두 번째 기사' }),
        ];
        render(<NewsList articles={articles} />);

        expect(screen.getByText('첫 번째 기사')).toBeInTheDocument();
        expect(screen.getByText('두 번째 기사')).toBeInTheDocument();
    });

    it('shows the empty state when articles is empty', () => {
        render(<NewsList articles={[]} />);
        expect(screen.getByText('표시할 뉴스가 없습니다.')).toBeInTheDocument();
    });

    it('renders 6 skeletons when loading=true (regardless of articles)', () => {
        const { container } = render(<NewsList articles={[]} loading />);
        // No empty-state, no real items
        expect(screen.queryByText('표시할 뉴스가 없습니다.')).not.toBeInTheDocument();
        // 6 skeleton children under the wrapper
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.children).toHaveLength(6);
    });

    it('prefers loading skeletons over rendering articles', () => {
        render(
            <NewsList
                loading
                articles={[makeArticle({ url: 'https://example.com/1', title: 'should not appear' })]}
            />,
        );
        expect(screen.queryByText('should not appear')).not.toBeInTheDocument();
    });
});
