// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('за замовчуванням приховує пароль', () => {
    render(<PasswordInput value="secret" onChange={() => {}} />);
    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'password');
  });

  it('показує пароль після кліку на іконку ока', async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="secret" onChange={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Показати пароль' }));

    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'text');
  });

  it('приховує пароль повторним кліком', async () => {
    const user = userEvent.setup();
    render(<PasswordInput value="secret" onChange={() => {}} />);

    const toggle = screen.getByRole('button');
    await user.click(toggle);
    await user.click(toggle);

    expect(screen.getByDisplayValue('secret')).toHaveAttribute('type', 'password');
  });
});
