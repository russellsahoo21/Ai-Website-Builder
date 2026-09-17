import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CheckoutPage from '../../src/views/CheckoutPage.jsx';

const mockClerkUser = {
  id: 'usr_checkout_test',
  fullName: 'Russell Test',
  primaryEmailAddress: { emailAddress: 'russell@test.com' }
};

vi.mock('@clerk/react', () => ({
  useUser: () => ({
    isSignedIn: true,
    isLoaded: true,
    user: mockClerkUser
  })
}));

describe('CheckoutPage Component', () => {
  let mockFetch;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890';
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    if (typeof window !== 'undefined') {
      window.fetch = mockFetch;
      window.alert = vi.fn();
    }
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('toggles between annual and monthly billing, adjusting pricing correctly', async () => {
    render(
      <CheckoutPage 
        initialPlanId="pro"
        initialBillingCycle="annual"
      />
    );

    // Initial Annual Price for Pro should display annual price in INR
    expect(screen.getAllByText('Pro Founder').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/₹15,588/i).length).toBeGreaterThanOrEqual(1);

    // Click Monthly billing button
    const monthlyBtn = screen.getByRole('button', { name: /^monthly/i });
    fireEvent.click(monthlyBtn);

    // Monthly pricing should now be displayed (₹1,599/mo)
    expect(screen.getAllByText(/₹1,599/i).length).toBeGreaterThanOrEqual(1);
  });

  it('validates promo coupon codes accurately (LAUNCH20 vs invalid)', async () => {
    render(
      <CheckoutPage 
        initialPlanId="pro"
        initialBillingCycle="annual"
      />
    );

    const couponInput = screen.getByPlaceholderText(/launch20/i);
    const form = couponInput.closest('form');

    // Test invalid coupon
    fireEvent.change(couponInput, { target: { value: 'INVALID99' } });
    fireEvent.submit(form);

    expect(screen.getByText(/invalid promo code/i)).toBeInTheDocument();

    // Test valid coupon LAUNCH20 (20% off)
    fireEvent.change(couponInput, { target: { value: 'LAUNCH20' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/applied/i)).toBeInTheDocument();
    });
  });

  it('triggers server order creation and opens Razorpay checkout modal with order details', async () => {
    const mockOpen = vi.fn();
    const mockOn = vi.fn();
    window.Razorpay = vi.fn(function (opts) {
      this.open = mockOpen;
      this.on = mockOn;
      this.options = opts;
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        orderId: 'order_test_998877',
        amount: 1558800,
        currency: 'INR',
        keyId: 'rzp_test_1234567890'
      })
    });

    render(
      <CheckoutPage 
        initialPlanId="pro"
        initialBillingCycle="annual"
        user={{
          id: 'usr_buyer_123',
          fullName: 'Alice Walker',
          email: 'alice@example.com'
        }}
      />
    );

    // Fill form details
    const nameInput = screen.getByPlaceholderText(/russell sahoo/i);
    const emailInput = screen.getByPlaceholderText(/name@company\.com/i);

    fireEvent.change(nameInput, { target: { value: 'Alice Walker' } });
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });

    // Find and click the Pay with Razorpay button
    const payBtn = screen.getByRole('button', { name: /pay.*with razorpay/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/razorpay/create-order',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    await waitFor(() => {
      expect(window.Razorpay).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: 'order_test_998877',
          amount: 1558800,
          currency: 'INR'
        })
      );
      expect(mockOpen).toHaveBeenCalled();
    });
  });

  it('fails closed in non-development environment if payment provider is unavailable', async () => {
    process.env.NODE_ENV = 'production';
    delete window.Razorpay;

    // Fail order creation or script load
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Service Unavailable' })
    });

    const handlePlanUpdated = vi.fn();

    render(
      <CheckoutPage 
        initialPlanId="pro"
        initialBillingCycle="annual"
        user={{
          id: 'usr_prod_test',
          fullName: 'Bob Prod',
          email: 'bob@example.com'
        }}
        onPlanUpdated={handlePlanUpdated}
      />
    );

    const nameInput = screen.getByPlaceholderText(/russell sahoo/i);
    const emailInput = screen.getByPlaceholderText(/name@company\.com/i);

    fireEvent.change(nameInput, { target: { value: 'Bob Prod' } });
    fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });

    const payBtn = screen.getByRole('button', { name: /pay.*with razorpay/i });
    fireEvent.click(payBtn);

    await waitFor(() => {
      // Verify it NEVER upgrades the user
      expect(handlePlanUpdated).not.toHaveBeenCalled();
    });
  });
});
