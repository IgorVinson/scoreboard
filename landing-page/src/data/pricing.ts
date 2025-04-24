import { IPricing } from "@/types";

export const tiers: IPricing[] = [
    {
        name: 'Starter',
        price: 2.99,
        priceId: 'price_1RHCtKLHxokF8KKdJnmgS5yX',
        features: [
            'Basic cloud integration',
            'Up to 5 team members',
            '20GB storage',
            'Email support',
        ],
    },
    {
        name: 'Pro',
        price: 3.99,
        priceId: 'price_1RHCtRLHxokF8KKdsoVVfhSC',
        features: [
            'Advanced cloud integration',
            'Up to 20 team members',
            '100GB storage',
            'Priority email & phone support',
            'Advanced analytics',
        ],
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        features: [
            'Full cloud integration',
            'Unlimited team members',
            'Unlimited storage',
            '24/7 dedicated support',
            'Custom solutions',
            'On-site training',
        ],
    },
]