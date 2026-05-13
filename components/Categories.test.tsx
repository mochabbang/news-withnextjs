import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Categories from './Categories';

describe('Categories', () => {
    it('renders all category buttons', () => {
        render(<Categories category="all" onSelectCategory={() => {}} />);
        const labels = ['전체', '비즈니스', '엔터테인먼트', '건강', '과학', '스포츠', '기술'];
        for (const label of labels) {
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        }
    });

    it('marks the active category with aria-pressed=true and others with false', () => {
        render(<Categories category="business" onSelectCategory={() => {}} />);
        expect(screen.getByRole('button', { name: '비즈니스' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(screen.getByRole('button', { name: '전체' })).toHaveAttribute(
            'aria-pressed',
            'false',
        );
    });

    it('calls onSelectCategory with the category name when a button is clicked', async () => {
        const user = userEvent.setup();
        const onSelectCategory = jest.fn();
        render(<Categories category="all" onSelectCategory={onSelectCategory} />);

        await user.click(screen.getByRole('button', { name: '비즈니스' }));

        expect(onSelectCategory).toHaveBeenCalledTimes(1);
        expect(onSelectCategory).toHaveBeenCalledWith('business');
    });
});
