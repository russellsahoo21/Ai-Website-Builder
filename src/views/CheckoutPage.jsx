"use client";
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Check, 
  Sparkles, 
  CreditCard, 
  Zap, 
  Building2, 
  Globe2, 
  Tag, 
  HelpCircle, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useUser } from '@clerk/react';
import { PLANS } from '../config/plans.js';

// Derive checkout configurations from single source of truth (plans.js)
const CHECKOUT_PLANS = {
  pro: {
    ...PLANS.pro,
    badge: 'Pro Subscription',
    projectBadge: 'Up to 50 active projects',
  },
  enterprise: {
    ...PLANS.enterprise,
    badge: 'Unlimited Subscription',
    projectBadge: 'Unlimited active projects (No caps)',
  }
};

export default function CheckoutPage({ 
  initialPlanId = 'pro', 
  initialBillingCycle = 'annual',
  returnRoute = 'landing',
  navigateTo,
  user: userProp,
  onPlanUpdated
}) {
  const { user: clerkUser, isLoaded } = useUser();
  const user = userProp || clerkUser;

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (navigateTo) {
      navigateTo(returnRoute || 'landing');
    } else {
      window.location.hash = returnRoute === 'landing' ? '' : `/${returnRoute}`;
    }
  };

  // Plan & Billing cycle state
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    return CHECKOUT_PLANS[initialPlanId] ? initialPlanId : 'pro';
  });

  useEffect(() => {
    if (initialPlanId && CHECKOUT_PLANS[initialPlanId]) {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId]);
  const [billingCycle, setBillingCycle] = useState(() => {
    return initialBillingCycle === 'monthly' ? 'monthly' : 'annual';
  });
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD' - Razorpay is native to INR

  // Customer billing form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    companyName: '',
    country: 'India',
    state: 'Maharashtra',
    taxId: ''
  });

  // Pre-fill user data when Clerk loads
  useEffect(() => {
    if (isLoaded && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || user.username || prev.fullName,
        email: user.primaryEmailAddress?.emailAddress || user.email || prev.email,
        phone: user.primaryPhoneNumber?.phoneNumber || user.phone || prev.phone
      }));
    }
  }, [user?.id, user?.fullName, user?.primaryEmailAddress?.emailAddress, user?.email, isLoaded]);

  // Coupon / Promo Code state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountPercent }
  const [couponError, setCouponError] = useState('');

  // Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null); // { paymentId, orderId, date, amount }
  
  // Clean internal Razorpay key resolution from environment variables (never exposed to client UI)
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.VITE_RAZORPAY_KEY_ID ||
    '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('aethercraft_custom_rzp_key');
      } catch {}
    }
  }, []);

  const plan = CHECKOUT_PLANS[selectedPlanId] || CHECKOUT_PLANS.pro;

  // Calculate pricing
  const isAnnual = billingCycle === 'annual';
  const rawUnitPrice = currency === 'INR' 
    ? (isAnnual ? plan.annualPriceINR : plan.monthlyPriceINR)
    : (isAnnual ? plan.annualPriceUSD : plan.monthlyPriceUSD);

  const durationMultiplier = isAnnual ? 12 : 1;
  const subtotal = rawUnitPrice * durationMultiplier;

  // Discount calculation
  const discountPercent = appliedCoupon ? appliedCoupon.discountPercent : 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalDue = subtotal - discountAmount;

  // Format currency display
  const formatMoney = (amount) => {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'LAUNCH20' || clean === 'FOUNDER20' || clean === 'RAZORPAY20') {
      setAppliedCoupon({ code: clean, discountPercent: 20 });
      setCouponError('');
    } else if (clean === 'VIP50') {
      setAppliedCoupon({ code: clean, discountPercent: 50 });
      setCouponError('');
    } else {
      setCouponError('Invalid promo code. Try "LAUNCH20" for 20% off.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Dynamically load Razorpay SDK script if not already present
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      if (typeof process !== 'undefined' && process.env?.VITEST) {
        resolve(Boolean(window.Razorpay));
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom')) {
        resolve(Boolean(window.Razorpay));
        return;
      }
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const timer = setTimeout(() => resolve(Boolean(window.Razorpay)), 2000);
        existing.addEventListener('load', () => { clearTimeout(timer); resolve(true); }, { once: true });
        existing.addEventListener('error', () => { clearTimeout(timer); resolve(false); }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      const timer = setTimeout(() => resolve(Boolean(window.Razorpay)), 2000);
      script.onload = () => { clearTimeout(timer); resolve(true); };
      script.onerror = () => { clearTimeout(timer); resolve(false); };
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Razorpay Checkout Trigger
  const handleInitiateRazorpay = async () => {
    if (!formData.fullName.trim()) {
      alert('Please enter your full name for the billing invoice.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      alert('Please enter a valid email address for receipt delivery.');
      return;
    }

    const effectiveUserId = user?.id || formData.email || 'guest_checkout';

    setIsProcessing(true);
    setProcessingStatus('Creating secure order with Razorpay...');

    const activeKey = (razorpayKey || '').trim();

    // If Razorpay Key is provided (starts with rzp_test_ or rzp_live_): STRICTLY use real Razorpay modal with server order
    if (activeKey && activeKey.startsWith('rzp_')) {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window.Razorpay === 'undefined') {
        setIsProcessing(false);
        setProcessingStatus('');
        alert('Razorpay payment gateway script failed to load. Please check your network connection and try again.');
        return;
      }

      try {
        // 1. Create order on server
        const orderRes = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            billingCycle,
            currency,
            userId: effectiveUserId,
            couponCode: appliedCoupon?.code || null
          })
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          setIsProcessing(false);
          setProcessingStatus('');
          alert(`Checkout Initialization Error: ${errData.error || 'Failed to create order on server.'}`);
          return;
        }

        const orderData = await orderRes.json();

        // 2. Configure Razorpay Standard Checkout with server order_id
        const options = {
          key: orderData.keyId || activeKey,
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'AetherCraft Engine',
          description: `${plan.name} - ${isAnnual ? 'Annual Subscription' : 'Monthly Subscription'}`,
          image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone || ''
          },
          notes: {
            ...(orderData.notes || {}),
            user_id: effectiveUserId,
            company: formData.companyName || 'Individual',
            country: formData.country,
            tax_id: formData.taxId || 'N/A'
          },
          theme: {
            color: '#090a0f',
            backdrop_color: 'rgba(9, 10, 15, 0.85)'
          },
          handler: async function (response) {
            setIsProcessing(true);
            setProcessingStatus('Payment authorized, confirming capture...');

            try {
              // 3. Server-side payment verification & capture
              const verifyRes = await fetch('/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_id: plan.id,
                  billing_cycle: billingCycle,
                  user_id: effectiveUserId
                })
              });

              const verifyData = await verifyRes.json().catch(() => ({}));

              if (verifyRes.ok && verifyData.status === 'captured') {
                setIsProcessing(false);
                setProcessingStatus('');
                if (onPlanUpdated) {
                  onPlanUpdated(plan.id);
                }
                setPaymentSuccess({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                  planName: plan.name,
                  amount: formatMoney(totalDue),
                  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                  isConfirmed: true,
                  isSimulation: false
                });
                return;
              }

              // 4. If status is still authorized, poll for capture confirmation
              if (verifyData.status === 'authorized') {
                setProcessingStatus('Payment authorized, confirming capture...');
                let captured = false;
                for (let attempt = 0; attempt < 5; attempt++) {
                  await new Promise(r => setTimeout(r, 2000));
                  const checkRes = await fetch('/api/payments/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      plan_id: plan.id,
                      billing_cycle: billingCycle
                    })
                  });
                  const checkData = await checkRes.json().catch(() => ({}));
                  if (checkRes.ok && checkData.status === 'captured') {
                    captured = true;
                    break;
                  }
                }

                if (captured) {
                  setIsProcessing(false);
                  setProcessingStatus('');
                  if (onPlanUpdated) {
                    onPlanUpdated(plan.id);
                  }
                  setPaymentSuccess({
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    planName: plan.name,
                    amount: formatMoney(totalDue),
                    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                    isConfirmed: true,
                    isSimulation: false
                  });
                  return;
                }
              }

              // 5. Payment not captured or declined
              setIsProcessing(false);
              setProcessingStatus('');
              alert(`Payment Capture Failed: ${verifyData.error || 'Payment was authorized but could not be captured by the bank. Your subscription was not activated and no funds were captured.'}`);
            } catch (err) {
              console.error('[Razorpay Verification Error]', err);
              setIsProcessing(false);
              setProcessingStatus('');
              alert('Error verifying payment capture with the server. Please refresh or contact support.');
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setProcessingStatus('');
            }
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', function (response) {
          setIsProcessing(false);
          setProcessingStatus('');
          alert(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        });
        razorpayInstance.open();
        return;
      } catch (err) {
        console.error('[Razorpay Checkout Error]', err);
        setIsProcessing(false);
        setProcessingStatus('');
        alert('Failed to launch Razorpay checkout: ' + (err.message || 'Unknown error'));
        return;
      }
    }

    if (process.env.NODE_ENV !== 'development') {
      setIsProcessing(false);
      setProcessingStatus('Payment provider is unavailable. Please try again later.');
      return;
    }

    // Interactive Demo / Sandbox Simulation when no live Razorpay credentials are bound yet (development only)
    setProcessingStatus('Simulating payment and server verification...');
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingStatus('');
      const mockPayId = `pay_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`;
      const mockOrderId = `order_rzp_${Math.random().toString(36).substring(2, 8)}`;
      
      const targetPlan = selectedPlanId || 'pro';
      if (onPlanUpdated) onPlanUpdated(targetPlan);

      setPaymentSuccess({
        paymentId: mockPayId,
        orderId: mockOrderId,
        signature: 'simulated_hmac_sha256_verified',
        planName: plan.name,
        amount: formatMoney(totalDue),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        isConfirmed: true,
        isSimulation: !activeKey
      });
    }, 1200);
  };

  // SUCCESS CONFIRMATION MODAL / VIEW
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-[#0d0f14] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Payment Verified & Active
          </span>

          <h2 className="text-2xl font-bold text-white mt-4 mb-2">Welcome to {paymentSuccess.planName}!</h2>
          <p className="text-xs text-zinc-400 mb-6 font-light leading-relaxed">
            Your Razorpay subscription has been confirmed. Your account is upgraded with frontier synthesis speeds, custom domains, and architectural memory.
          </p>

          <div className="bg-[#13161c] border border-zinc-800 rounded-xl p-4 text-left space-y-2.5 mb-6 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Transaction ID:</span>
              <span className="font-mono text-zinc-200">{paymentSuccess.paymentId}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Amount Paid:</span>
              <span className="font-semibold text-white">{paymentSuccess.amount}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Billing Date:</span>
              <span className="text-zinc-300">{paymentSuccess.date}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Gateway:</span>
              <span className="text-indigo-400 font-medium flex items-center gap-1">
                Razorpay Secure Checkout {paymentSuccess.isSimulation && '(Test Mode)'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (navigateTo) navigateTo('studio');
                else window.location.hash = '/studio';
              }}
              className="w-full py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Launch Studio with Pro Powers</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>

            <button
              onClick={() => {
                if (navigateTo) navigateTo('dashboard');
                else window.location.hash = '/dashboard';
              }}
              className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 antialiased selection:bg-zinc-700 pb-20">
      {/* Top Checkout Header */}
      <header className="border-b border-zinc-800/80 bg-[#0d0f14]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-white">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>AetherCraft Checkout</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-full">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2 py-1 sm:px-2.5 rounded-md font-medium transition ${
                  currency === 'INR' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 py-1 sm:px-2.5 rounded-md font-medium transition ${
                  currency === 'USD' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT 7 COLS: Plan selector & Billing info */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Select Plan & Billing Cadence */}
            <section className="bg-[#0d0f14] border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-semibold text-white">1. Select Plan & Billing Cadence</h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">Choose your subscription tier and billing cadence.</p>
                </div>

                {/* Monthly / Annual Toggle */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs self-start sm:self-auto">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                      billingCycle === 'monthly' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer ${
                      billingCycle === 'annual' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-1 rounded">20% off</span>
                  </button>
                </div>
              </div>

              {/* Plan Switcher Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {Object.values(CHECKOUT_PLANS).map((p) => {
                  const isSelected = selectedPlanId === p.id;
                  const price = currency === 'INR'
                    ? (isAnnual ? p.annualPriceINR : p.monthlyPriceINR)
                    : (isAnnual ? p.annualPriceUSD : p.monthlyPriceUSD);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-4 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#14171f] border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {p.projectBadge}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white mb-1">
                        {formatMoney(price)}
                        <span className="text-xs font-normal text-zinc-400"> /mo</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-light line-clamp-1">{p.tagline}</p>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Showcase Card for Selected Plan */}
              <div className="p-5 rounded-xl border bg-[#14171f] border-indigo-500/70 ring-1 ring-indigo-500/30 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white tracking-tight">{plan.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                        {plan.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light">{plan.tagline}</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-bold text-white">
                      {formatMoney(rawUnitPrice)}
                      <span className="text-xs font-normal text-zinc-400"> /mo</span>
                    </div>
                    <span className="text-[11px] text-indigo-300 font-mono">
                      {isAnnual ? 'Billed annually (Save 20%)' : 'Billed monthly'}
                    </span>
                  </div>
                </div>

                {/* Plan Highlights Grid */}
                <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className={`w-3.5 h-3.5 shrink-0 ${i === 0 ? 'text-emerald-400 font-bold' : 'text-indigo-400'}`} />
                      <span className={i === 0 ? 'font-medium text-white' : ''}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Step 2: Customer & Billing Information */}
            <section className="bg-[#0d0f14] border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-white mb-1">2. Billing Details</h2>
              <p className="text-xs text-zinc-400 font-light mb-6">Enter your contact info for the official tax invoice and receipt.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-300 mb-1.5 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g. Russell Sahoo"
                    className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1.5 font-medium">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="name@company.com"
                    className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1.5 font-medium">Mobile Number (Optional for UPI/SMS)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1.5 font-medium">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Studio or Agency Ltd"
                    className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1.5 font-medium">Country / Region</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Germany">Germany</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1.5 font-medium">GSTIN / VAT ID (Optional)</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition uppercase"
                  />
                </div>
              </div>
            </section>

            {/* Step 3: Payment Gateway */}
            <section className="bg-[#0d0f14] border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-white">3. Payment Gateway</h2>
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Razorpay Verified</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 font-light mb-5">
                Instant authorization via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Netbanking, or Wallets.
              </p>

              {/* Gateway Banner */}
              <div className="p-4 rounded-xl border bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/60 border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
                    RZP
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Razorpay Secure Gateway</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        PCI-DSS Level 1
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-light mt-0.5">
                      Official Razorpay checkout with instant UPI QR, Cards & NetBanking authorization.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 sm:self-center">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit SSL</span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT 5 COLS: Order Summary & Pay CTA */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Sticky Order Summary Card */}
            <div className="bg-[#0d0f14] border border-zinc-800 rounded-2xl p-6 sticky top-24 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-[10px] font-mono uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {isAnnual ? 'Annual Billing' : 'Monthly Billing'}
                </span>
              </h3>

              {/* Selected Plan Details */}
              <div className="p-4 rounded-xl bg-[#12151b] border border-zinc-800 mb-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{plan.name}</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">
                    {formatMoney(rawUnitPrice)} <span className="text-[10px] text-zinc-400 font-normal">/mo</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-light mb-3">{plan.tagline}</p>

                {/* Plan Highlights */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-2 text-[11px] text-zinc-300">
                  {plan.features.slice(0, 4).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyCoupon} className="mb-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Promo code (e.g. LAUNCH20)"
                      disabled={Boolean(appliedCoupon)}
                      className="w-full bg-[#13161c] border border-zinc-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 uppercase focus:outline-none focus:border-indigo-500 transition disabled:opacity-60"
                    />
                  </div>
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3 py-2 rounded-lg bg-red-950/40 text-red-400 border border-red-800/60 hover:bg-red-900/50 text-xs font-medium transition cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {couponError && <p className="text-[10px] text-amber-400 mt-1.5">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Promo code "{appliedCoupon.code}" applied ({appliedCoupon.discountPercent}% OFF)
                  </p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-t border-zinc-800 pt-4 mb-6">
                <div className="flex justify-between text-zinc-400">
                  <span>{plan.name} ({isAnnual ? '12 months' : '1 month'})</span>
                  <span className="text-zinc-200 font-mono">{formatMoney(subtotal)}</span>
                </div>

                {isAnnual && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Annual discount (20% off)</span>
                    <span>Included in rate</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promo discount ({appliedCoupon.discountPercent}%)</span>
                    <span className="font-mono">-{formatMoney(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-zinc-400">
                  <span>Estimated Taxes & GST</span>
                  <span className="text-zinc-400 font-mono">₹0 / Included</span>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Due Today</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono">{formatMoney(totalDue)}</div>
                    <div className="text-[10px] text-zinc-500 font-light">
                      {isAnnual ? 'Renews annually, cancel anytime' : 'Renews monthly, cancel anytime'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleInitiateRazorpay}
                className="w-full py-3.5 rounded-xl font-semibold text-xs tracking-tight transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-60 bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{processingStatus || 'Opening Razorpay Checkout...'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {formatMoney(totalDue)} with Razorpay</span>
                  </>
                )}
              </button>

              {/* Security & Guarantee Footer */}
              <div className="mt-5 pt-4 border-t border-zinc-800/60 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>14-day money-back guarantee • Zero risk</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-light">
                  By confirming, you agree to AetherCraft's Terms of Service and Privacy Policy.
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

