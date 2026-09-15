// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('RegisterPage', () => {
  it('показує помилки валідації при відправці порожньої форми', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /зареєструватись/i }));

    expect(await screen.findByText("Вкажи ім'я")).toBeInTheDocument();
    expect(await screen.findByText('Введи коректний email')).toBeInTheDocument();
    expect(await screen.findByText('Введи пароль')).toBeInTheDocument();
  });

  it('показує помилку для закороткого пароля', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Ім'я"), 'Аліна');
    await user.type(screen.getByLabelText('Email'), 'alina@example.com');
    await user.type(screen.getByLabelText('Пароль'), '123');
    await user.click(screen.getByRole('button', { name: /зареєструватись/i }));

    expect(await screen.findByText('Пароль має містити щонайменше 6 символів')).toBeInTheDocument();
  });
});
