import { useState } from 'react';
import { Check, ShieldCheck, Sparkles, Zap, HardDrive, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { usePlans } from '../hooks/usePayment.js';
import { paymentApi } from '../services/payment.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { formatFileSize } from '../utils/formatFileSize.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Pricing() {
  const { data, isLoading } = usePlans();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [purchasingPlanId, setPurchasingPlanId] = useState(null);

  const plans = data?.plans || [];
  const keyId = data?.keyId || '';

  const handlePurchase = async (plan) => {
    const planId = plan._id || plan.id;
    setPurchasingPlanId(planId);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        setPurchasingPlanId(null);
        return;
      }

      // Step 1: Create Order on Backend
      const orderData = await paymentApi.createOrder(planId);
      const rzpOrderId = orderData.orderId;
      const rzpKeyId = orderData.keyId || keyId;
      const amount = orderData.amount;
      const currency = orderData.currency || 'INR';

      // Step 2: Configure Razorpay Checkout
      const options = {
        key: rzpKeyId,
        amount: amount,
        currency: currency,
        name: 'Storvix Cloud Storage',
        description: `Upgrade to ${plan.name} (${formatFileSize(plan.storageQuotaBytes)})`,
        order_id: rzpOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#2563EB',
        },
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...', { id: 'payment-verify' });
            // Step 3: Verify Payment Server-Side
            await paymentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast.success(`🎉 Upgraded to ${plan.name} plan successfully!`, { id: 'payment-verify' });
            qc.invalidateQueries({ queryKey: ['storage'] });
            qc.invalidateQueries({ queryKey: ['user'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
          } catch (err) {
            toast.error(err.message || 'Payment verification failed', { id: 'payment-verify' });
          } finally {
            setPurchasingPlanId(null);
          }
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled');
            setPurchasingPlanId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate checkout');
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-up py-4">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-600/20 dark:bg-blue-950/60 dark:text-blue-400">
          <Sparkles size={14} />
          Flexible Storage Plans
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Upgrade Your Cloud Storage
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 sm:text-base">
          Get high-speed, secure cloud storage with seamless instant Razorpay checkout.
        </p>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free Tier Card */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            <div>
              <div className="mb-4 inline-block rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <HardDrive size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Free Tier</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Standard storage for basic usage</p>

              <div className="mt-6 flex items-baseline">
                <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-slate-900 dark:text-slate-100">₹0</span>
                <span className="ml-1 text-xs font-semibold text-slate-500">/ forever</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>5 GB High-Speed Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>File Previews & Sharing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-500 shrink-0" />
                  <span>Version History & Trash</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="mt-8 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50"
            >
              Current Default Plan
            </button>
          </div>

          {/* Dynamic Plans from Backend (Basic 100GB, Premium 1TB) */}
          {plans.map((plan) => {
            const planId = plan._id || plan.id;
            const priceRs = Math.round(plan.priceInPaise / 100);
            const isPopular = plan.name.toLowerCase().includes('basic');
            const isBusy = purchasingPlanId === planId;

            return (
              <div
                key={planId}
                className={`relative flex flex-col justify-between rounded-3xl p-6 shadow-md transition hover:shadow-xl ${
                  isPopular
                    ? 'border-2 border-blue-500 bg-gradient-to-b from-blue-50/50 via-white to-indigo-50/30 dark:from-blue-950/40 dark:via-slate-900 dark:to-indigo-950/30'
                    : 'border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="mb-4 inline-block rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>

                  <div className="mt-6 flex items-baseline">
                    <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                      ₹{priceRs}
                    </span>
                    <span className="ml-1 text-xs font-semibold text-slate-500">/ one-time</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatFileSize(plan.storageQuotaBytes)} Storage Quota
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Instant Upgrade via Razorpay</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>Unlimited Version Revisions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500 shrink-0" />
                      <span>AI Assistant Support</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={Boolean(purchasingPlanId)}
                  onClick={() => handlePurchase(plan)}
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50 ${
                    isPopular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                  }`}
                >
                  {isBusy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Upgrade to {plan.name}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        <ShieldCheck size={18} className="text-emerald-500" />
        <span>Secure 256-bit SSL encrypted payments processed by Razorpay</span>
      </div>
    </div>
  );
}
