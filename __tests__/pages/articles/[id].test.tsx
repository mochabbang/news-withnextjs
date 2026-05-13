import { render, screen, waitFor } from '@testing-library/react';
import ArticlePage from '@/pages/articles/[id]';
import { encodeArticleId } from '@/lib/articleId';
import { saveArticleSnapshot } from '@/lib/articleSession';

const mockRouter = {
    query: {} as { id?: string },
    isReady: true,
    push: jest.fn(),
};

jest.mock('next/router', () => ({
    useRouter: () => mockRouter,
}));

const fetchMock = jest.fn();

beforeEach(() => {
    sessionStorage.clear();
    mockRouter.query = {};
    mockRouter.isReady = true;
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
});

function setIdInRouter(url: string): string {
    const id = encodeArticleId(url);
    mockRouter.query = { id };
    return id;
}

describe('ArticlePage', () => {
    it('shows error message when id decodes to a non-http(s) URL', async () => {
        mockRouter.query = { id: '!!!invalid!!!' };
        render(<ArticlePage />);
        expect(await screen.findByText(/잘못된 기사 링크/)).toBeInTheDocument();
    });

    it('shows fallback view (CTA only) when no snapshot exists for the id', async () => {
        setIdInRouter('https://example.com/orphan');
        render(<ArticlePage />);

        const cta = await screen.findByRole('link', { name: /원문 보기/ });
        expect(cta).toHaveAttribute('href', 'https://example.com/orphan');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('renders snapshot data immediately, then merges API response (success path)', async () => {
        const url = 'https://example.com/x';
        const id = setIdInRouter(url);
        saveArticleSnapshot(id, {
            url,
            title: 'Snapshot Title',
            description: 'Snapshot desc',
            urlToImage: 'https://example.com/img.png',
            publishedAt: '2026-04-29T00:00:00Z',
            author: 'A',
            sourceName: 'Example',
            sourceLanguage: 'en',
        });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                summary: '핵심 요약',
                displayTitle: '번역된 제목',
                displayDescription: '번역된 설명',
                originalTitle: 'Snapshot Title',
                originalDescription: 'Snapshot desc',
                translated: true,
            }),
        });

        render(<ArticlePage />);

        // Snapshot rendered first
        expect(await screen.findByText('Snapshot Title')).toBeInTheDocument();

        // API merged after
        await waitFor(() => {
            expect(screen.getByText('번역된 제목')).toBeInTheDocument();
        });
        expect(screen.getByText('번역된 설명')).toBeInTheDocument();
        expect(screen.getByText('핵심 요약')).toBeInTheDocument();
        expect(screen.getByText('Snapshot Title')).toBeInTheDocument(); // original line

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/article',
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('keeps snapshot data and clears loading when API call fails', async () => {
        const url = 'https://example.com/y';
        const id = setIdInRouter(url);
        saveArticleSnapshot(id, {
            url,
            title: '제목',
            description: '설명',
            urlToImage: null,
            publishedAt: '2026-04-29T00:00:00Z',
            author: null,
            sourceName: 'src',
            sourceLanguage: 'ko',
        });

        fetchMock.mockRejectedValueOnce(new Error('network'));

        render(<ArticlePage />);

        await waitFor(() => {
            expect(screen.getByText(/요약을 생성하지 못했습니다/)).toBeInTheDocument();
        });
        expect(screen.getByText('제목')).toBeInTheDocument();
    });

    it('sends snapshot fields including sourceLanguage in the POST body', async () => {
        const url = 'https://example.com/z';
        const id = setIdInRouter(url);
        saveArticleSnapshot(id, {
            url,
            title: 'T',
            description: 'D',
            urlToImage: null,
            publishedAt: '2026-04-29T00:00:00Z',
            author: null,
            sourceName: 'S',
            sourceLanguage: 'ja',
        });
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                summary: 's',
                displayTitle: 'T',
                displayDescription: 'D',
                originalTitle: 'T',
                originalDescription: 'D',
                translated: false,
            }),
        });

        render(<ArticlePage />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalled();
        });

        const callOpts = fetchMock.mock.calls[0][1] as RequestInit;
        const body = JSON.parse(callOpts.body as string);
        expect(body).toEqual({
            title: 'T',
            description: 'D',
            url,
            sourceLanguage: 'ja',
        });
    });
});
