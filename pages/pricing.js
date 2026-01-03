import { useState } from 'react';
import { useRouter } from 'next/router';
import useUserPlan from '../hooks/useUserPlan';
import { Check, Star, Shield, Zap } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export default function PricingPage() {
    const router = useRouter();
    const { isLoaded, isSignedIn } = useUser();
    const { isPro, isTrial, daysLeft, plan, isLoading } = useUserPlan();
    const [billingCycle, setBillingCycle] = useState('monthly');

    const plans = [
        {
            name: 'Free Trial',
            price: '$0',
            period: '/7 days',
            description: 'Perfect for testing out the power of AI listing generation.',
            features: [
                '3 AI Listing Generations',
                'Basic MLS Format',
                'Standard Support',
                'Access to Templates'
            ],
            cta: 'Start Free Trial',
            highlight: false,
            available: !isPro && !isTrial
        },
        {
            name: 'Professional',
            price: billingCycle === 'monthly' ? '$29' : '$290',
            period: billingCycle === 'monthly' ? '/month' : '/year',
            description: 'For high-performing agents who need professional marketing materials.',
            features: [
                'Unlimited AI Listings',
                'All Styles (MLS, Luxury, Social)',
                'Professional PDF Flyers',
                'Priority Support',
                'Custom Branding',
                'History & Analytics'
            ],
            cta: isPro ? 'Current Plan' : 'Upgrade Now',
            highlight: true,
            available: true
        }
    ];

    const handleSubscribe = async (planName) => {
        if (!isSignedIn) {
            router.push('/sign-up');
            return;
        }

        // Redirect to Stripe Checkout
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: planName.toLowerCase(),
                    interval: billingCycle
                })
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (error) {
            console.error('Checkout error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Choose the plan that fits your business. No hidden fees. Cancel anytime.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative w-14 h-8 bg-slate-700 rounded-full p-1 transition-colors hover:bg-slate-600"
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
                            Yearly <span className="text-green-400 text-xs ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Current Status Banner */}
                {isSignedIn && isLoaded && (
                    <div className="max-w-3xl mx-auto mb-16 p-6 rounded-2xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-1">Current Status</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isPro ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {isPro ? 'Professional Plan' : isTrial ? 'Free Trial' : 'Free Plan'}
                                    </span>
                                    {daysLeft !== null && daysLeft < 1000 && (
                                        <span className="text-slate-400 text-sm">
                                            {daysLeft} days remaining
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!isPro && (
                                <button
                                    onClick={() => document.getElementById('plans').scrollIntoView({ behavior: 'smooth' })}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Upgrade Account
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Plans Grid */}
                <div id="plans" className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`relative p-8 rounded-3xl border ${plan.highlight
                                    ? 'bg-slate-800/80 border-purple-500/50 shadow-2xl shadow-purple-900/20'
                                    : 'bg-slate-900/50 border-slate-800'
                                } backdrop-blur-xl flex flex-col`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-xs font-bold uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm h-10">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-slate-400">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                        <Check className={`w-5 h-5 shrink-0 ${plan.highlight ? 'text-green-400' : 'text-slate-500'}`} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSubscribe(plan.name)}
                                disabled={plan.cta === 'Current Plan'}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${plan.highlight
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
                                        : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                                    } ${plan.cta === 'Current Plan' ? 'opacity-50 cursor-default' : ''}`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-24 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {[
                            { q: 'Can I cancel anytime?', a: 'Yes, there are no long-term contracts. You can cancel your subscription at any time from your dashboard.' },
                            { q: 'What happens after my trial?', a: 'Your account will revert to the free tier. Your saved listings will remain accessible, but you won\'t be able to generate new advanced listings or flyers until you upgrade.' },
                            { q: 'Do you offer team pricing?', a: 'Yes! Contact our sales team for special pricing for brokerages and teams of 5+ agents.' }
                        ].map((faq, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                                <h3 className="font-bold mb-2">{faq.q}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
