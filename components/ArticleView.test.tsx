import { render, screen } from '@testing-library/react';
import ArticleView, { ArticleViewData } from './ArticleView';

function makeData(overrides: Partial<ArticleViewData> = {}): ArticleViewData {
    return {
        url: 'https://example.com/article',
        sourceName: 'Example News',
        publishedAt: '2026-04-29T00:00:00Z',
        author: '작성자',
        imageUrl: 'https://example.com/img.png',
        displayTitle: '표시 제목',
        displayDescription: '표시 발췌',
        originalTitle: '표시 제목',
        originalDescription: '표시 발췌',
        translated: false,
        summary: 'AI가 만든 한 줄 요약',
        loading: false,
        ...overrides,
    };
}

describe('ArticleView', () => {
    it('renders the display title, description, source, and image', () => {
        render(<ArticleView data={makeData()} />);
        expect(screen.getByText('표시 제목')).toBeInTheDocument();
        expect(screen.getByText('표시 발췌')).toBeInTheDocument();
        expect(screen.getByText('Example News')).toBeInTheDocument();
        expect(screen.getByAltText('표시 제목')).toBeInTheDocument();
    });

    it('shows the AI summary when present', () => {
        render(<ArticleView data={makeData({ summary: '핵심은 X입니다' })} />);
        expect(screen.getByText(/핵심은 X입니다/)).toBeInTheDocument();
    });

    it('shows a fallback notice when summary is null', () => {
        render(<ArticleView data={makeData({ summary: null })} />);
        expect(screen.getByText(/요약을 생성하지 못했습니다|요약을 사용할 수 없습니다/)).toBeInTheDocument();
    });

    it('shows loading state when loading=true', () => {
        render(<ArticleView data={makeData({ loading: true })} />);
        expect(screen.getByText(/불러오는 중|로딩|준비/)).toBeInTheDocument();
    });

    it('shows original title only when translated and different', () => {
        const { rerender } = render(
            <ArticleView
                data={makeData({
                    displayTitle: '번역 제목',
                    originalTitle: 'Original Title',
                    translated: true,
                })}
            />,
        );
        expect(screen.getByText('Original Title')).toBeInTheDocument();

        rerender(
            <ArticleView
                data={makeData({
                    displayTitle: 'Same',
                    originalTitle: 'Same',
                    translated: true,
                })}
            />,
        );
        // Title rendered only in heading, not as separate original line
        expect(screen.getAllByText('Same')).toHaveLength(1);
    });

    it('renders the "원문 보기" CTA pointing to the article URL with rel=noopener noreferrer and target=_blank', () => {
        render(<ArticleView data={makeData({ url: 'https://example.com/x' })} />);
        const cta = screen.getByRole('link', { name: /원문 보기|원문 전체/ });
        expect(cta).toHaveAttribute('href', 'https://example.com/x');
        expect(cta).toHaveAttribute('target', '_blank');
        expect(cta).toHaveAttribute('rel', expect.stringContaining('noopener'));
        expect(cta).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    });

    it('shows the copyright notice including the source name', () => {
        render(<ArticleView data={makeData({ sourceName: '한겨레' })} />);
        const notice = screen.getByText(/저작권/);
        expect(notice).toHaveTextContent('한겨레');
    });

    it('falls back to "원문 보기" only when displayTitle is empty (fallback mode)', () => {
        render(
            <ArticleView
                data={makeData({
                    displayTitle: '',
                    displayDescription: null,
                    sourceName: '',
                    summary: null,
                    imageUrl: null,
                })}
            />,
        );
        expect(screen.getByRole('link', { name: /원문 보기|원문 전체/ })).toBeInTheDocument();
    });
});
