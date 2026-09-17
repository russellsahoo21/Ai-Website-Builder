import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../../src/views/DashboardPage.jsx';
import { useUser } from '@clerk/react';

vi.mock('@clerk/react', () => ({
  useUser: vi.fn(),
  useClerk: () => ({
    signOut: vi.fn(),
    openUserProfile: vi.fn(),
  }),
  dark: {},
}));

vi.mock('../../src/services/dbService.js', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../src/services/supabaseClient.js', () => ({
  isCloudDbConfigured: vi.fn().mockReturnValue(false),
}));

vi.mock('../../src/services/tokenService.js', () => ({
  getTokenUsage: vi.fn().mockReturnValue({ used: 5000, total: 100000 }),
  setCurrentUserId: vi.fn(),
}));

describe('DashboardPage Component', () => {
  let mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        plan: 'free',
        used: 10000,
        total: 100000,
        isUnlimited: false,
        analytics: { dailyTrend: [], modelBreakdown: {} }
      })
    });
    vi.stubGlobal('fetch', mockFetch);
    if (typeof window !== 'undefined') {
      window.fetch = mockFetch;
      window.alert = vi.fn();
    }

    useUser.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: 'usr_dashboard_test',
        fullName: 'Test Developer',
        primaryEmailAddress: { emailAddress: 'dev@aethercraft.io' }
      }
    });
  });

  it('renders dashboard with project cards, search, and UsageAnalyticsWidget without error', async () => {
    const mockProjects = [
      {
        id: 'proj_1',
        name: 'Fintech Dashboard',
        prompt: 'Build finance SaaS',
        updatedAt: new Date().toISOString(),
        files: { 'src/App.jsx': '// app code' }
      },
      {
        id: 'proj_2',
        name: 'Crypto Portfolio',
        prompt: 'Crypto tracking web app',
        updatedAt: new Date().toISOString(),
        files: { 'src/App.jsx': '// crypto code' }
      }
    ];

    render(
      <DashboardPage 
        projects={mockProjects}
        userProfile={{ plan: 'free' }}
        onCreateNewProject={vi.fn()}
      />
    );

    // Verify projects are rendered
    expect(screen.getByText('Fintech Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Crypto Portfolio')).toBeInTheDocument();

    // Verify UsageAnalyticsWidget is integrated
    expect(screen.getByText('Usage & Quotas')).toBeInTheDocument();
  });

  it('calls onCreateNewProject when user clicks New Project button and within limits', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();

    render(
      <DashboardPage 
        projects={[]}
        userProfile={{ plan: 'free' }}
        onCreateNewProject={handleCreate}
      />
    );

    // Look for any of the "New Project" buttons
    const newProjectBtns = screen.getAllByRole('button', { name: /new project/i });
    expect(newProjectBtns.length).toBeGreaterThanOrEqual(1);

    await user.click(newProjectBtns[0]);
    expect(handleCreate).toHaveBeenCalledWith('New Project', '');
  });

  it('enforces free tier limit when user reaches 5/5 projects', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();
    const navigateTo = vi.fn();

    const maxProjects = Array.from({ length: 5 }, (_, i) => ({
      id: `proj_${i + 1}`,
      name: `Project ${i + 1}`,
      prompt: `Prompt ${i + 1}`,
      updatedAt: new Date().toISOString(),
      files: { 'src/App.jsx': '// code' }
    }));

    render(
      <DashboardPage 
        projects={maxProjects}
        userProfile={{ plan: 'free' }}
        onCreateNewProject={handleCreate}
        navigateTo={navigateTo}
      />
    );

    // When limit reached, button transforms to "Upgrade to Add"
    const upgradeBtn = screen.getByRole('button', { name: /upgrade to add/i });
    expect(upgradeBtn).toBeInTheDocument();
    await user.click(upgradeBtn);

    // Should NOT call create project, but redirect to checkout upgrade
    expect(handleCreate).not.toHaveBeenCalled();
    expect(navigateTo).toHaveBeenCalledWith('checkout', { plan: 'pro' });
    expect(window.alert).toHaveBeenCalled();
  });

  it('filters project list based on search query', async () => {
    const mockProjects = [
      {
        id: 'proj_alpha',
        name: 'Alpha Analytics',
        prompt: 'Analytics app',
        updatedAt: new Date().toISOString(),
        files: { 'src/App.jsx': '// code' }
      },
      {
        id: 'proj_beta',
        name: 'Beta Storefront',
        prompt: 'Ecommerce store',
        updatedAt: new Date().toISOString(),
        files: { 'src/App.jsx': '// code' }
      }
    ];

    render(
      <DashboardPage 
        projects={mockProjects}
        userProfile={{ plan: 'free' }}
      />
    );

    expect(screen.getByText('Alpha Analytics')).toBeInTheDocument();
    expect(screen.getByText('Beta Storefront')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search projects/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Alpha Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Beta Storefront')).not.toBeInTheDocument();
  });
});
