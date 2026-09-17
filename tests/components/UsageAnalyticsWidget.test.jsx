import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UsageAnalyticsWidget from '../../src/components/UsageAnalyticsWidget.jsx';

describe('UsageAnalyticsWidget Component', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    if (typeof window !== 'undefined') {
      window.fetch = mockFetch;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders free plan metrics and calculates quota percentage accurately', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plan: 'free',
        used: 25000,
        total: 100000,
        isUnlimited: false,
        analytics: {
          dailyTrend: [{ date: '2026-09-17', tokens: 25000 }],
          modelBreakdown: { 'openrouter/free': 25000 }
        }
      })
    });

    render(
      <UsageAnalyticsWidget 
        userProfile={{ plan: 'free' }}
        onUpgrade={vi.fn()}
        projectCount={3}
      />
    );

    expect(screen.getByText('Usage & Quotas')).toBeInTheDocument();

    await waitFor(() => {
      // Free plan name
      expect(screen.getByText('Developer Free')).toBeInTheDocument();
      // Quota calculation: 25,000 / 100,000 = 25%
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    expect(screen.getByText(/100k Monthly Free Tier/i)).toBeInTheDocument();
  });

  it('renders Pro tier correctly with Unlimited label and hides Upgrade Pro button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plan: 'pro',
        used: 150000,
        total: null,
        isUnlimited: true,
        analytics: {
          dailyTrend: [],
          modelBreakdown: {}
        }
      })
    });

    const handleUpgrade = vi.fn();
    render(
      <UsageAnalyticsWidget 
        userProfile={{ plan: 'pro' }}
        onUpgrade={handleUpgrade}
        projectCount={12}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pro Founder')).toBeInTheDocument();
      expect(screen.getByText('Unlimited')).toBeInTheDocument();
      expect(screen.getByText(/Active Subscription • Unlimited Syntheses/i)).toBeInTheDocument();
    });

    // Upgrade button should NOT be rendered when user is already on unlimited plan
    expect(screen.queryByText('Upgrade Pro')).not.toBeInTheDocument();
  });

  it('invokes onUpgrade callback when user clicks Upgrade Pro on Free tier', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plan: 'free',
        used: 80000,
        total: 100000,
        isUnlimited: false
      })
    });

    const user = userEvent.setup();
    const handleUpgrade = vi.fn();

    render(
      <UsageAnalyticsWidget 
        userProfile={{ plan: 'free' }}
        onUpgrade={handleUpgrade}
        projectCount={4}
      />
    );

    const upgradeBtn = await screen.findByRole('button', { name: /upgrade pro/i });
    await user.click(upgradeBtn);

    expect(handleUpgrade).toHaveBeenCalledTimes(1);
  });
});
