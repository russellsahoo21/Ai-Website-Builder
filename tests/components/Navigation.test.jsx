import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navigation from '../../src/components/Navigation.jsx';
import { useUser } from '@clerk/react';

vi.mock('@clerk/react', () => ({
  useUser: vi.fn(),
  SignInButton: ({ children }) => <button data-testid="clerk-sign-in">{children}</button>,
  SignUpButton: ({ children }) => <button data-testid="clerk-sign-up">{children}</button>,
  UserButton: () => <div data-testid="clerk-user-button">Clerk User Button</div>,
}));

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guest state with navigation links, sign in/up and studio CTA', async () => {
    useUser.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      user: null
    });

    const navigateTo = vi.fn();
    render(<Navigation currentRoute="landing" navigateTo={navigateTo} />);

    // Brand and core links
    expect(screen.getByText('AetherCraft')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();

    // Guest Auth CTA buttons
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /launch studio/i })).toBeInTheDocument();

    // Clicking a link invokes navigateTo
    const user = userEvent.setup();
    await user.click(screen.getByText('Pricing'));
    expect(navigateTo).toHaveBeenCalledWith('pricing');
  });

  it('renders authenticated state with Dashboard link and UserButton avatar', async () => {
    useUser.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'usr_test123',
        firstName: 'Russell',
        primaryEmailAddress: { emailAddress: 'russell@test.com' }
      }
    });

    const navigateTo = vi.fn();
    render(<Navigation currentRoute="dashboard" navigateTo={navigateTo} />);

    // Authenticated links
    const dashboardBtns = screen.getAllByRole('button', { name: /dashboard/i });
    expect(dashboardBtns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument();

    // Guest buttons should NOT appear
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
