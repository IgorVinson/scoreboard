'use client'
import { useState } from "react";
import clsx from "clsx";
import { BsFillCheckCircleFill } from "react-icons/bs";

import { IPricing } from "@/types";

interface Props {
    tier: IPricing;
    highlight?: boolean;
}

// Dashboard app URLs
const DASHBOARD_BASE_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:5173';
const DASHBOARD_LOGIN_URL = `${DASHBOARD_BASE_URL}/login`;

const PricingColumn: React.FC<Props> = ({ tier, highlight }: Props) => {
    const { name, price, features, priceId } = tier;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscription = async () => {
        // Reset any previous errors
        setError(null);
        
        // Don't process if no priceId (like for Enterprise/Custom pricing) or already loading
        if (!priceId || isLoading) {
            // For Enterprise/Custom pricing, you might want to redirect to a contact form
            if (!priceId) {
                window.location.href = "/contact"; // Redirect to contact page for custom pricing
            }
            return;
        }

        try {
            setIsLoading(true);
            
            // Instead of creating a checkout session directly,
            // redirect to the dashboard login page with plan info as URL parameters
            const loginUrl = new URL(DASHBOARD_LOGIN_URL);
            
            // Add plan information as URL parameters
            loginUrl.searchParams.append('planId', priceId);
            loginUrl.searchParams.append('planName', name);
            loginUrl.searchParams.append('planPrice', price.toString());
            loginUrl.searchParams.append('source', 'pricing_page');
            loginUrl.searchParams.append('intent', 'subscribe');
            
            // Redirect to dashboard login page
            console.log(`Redirecting to dashboard login: ${loginUrl.toString()}`);
            window.location.href = loginUrl.toString();
            
        } catch (error) {
            console.error('Error during redirect:', error);
            setError(error instanceof Error ? error.message : "An unknown error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className={clsx("w-full max-w-sm mx-auto bg-white rounded-xl border border-gray-200 lg:max-w-full", { "shadow-lg": highlight })}>
            <div className="p-6 border-b border-gray-200 rounded-t-xl">
                <h3 className="text-2xl font-semibold mb-4">{name}</h3>
                <p className="text-3xl md:text-5xl font-bold mb-6">
                    <span className={clsx({ "text-secondary": highlight })}>
                        {typeof price === 'number' ? `$${price}` : price}
                    </span>
                    {typeof price === 'number' && <span className="text-lg font-normal text-gray-600">/mo</span>}
                </p>
                {error && (
                    <div className="mb-4 text-red-500 text-sm p-2 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}
                <button 
                    className={clsx("w-full py-3 px-4 rounded-full transition-colors", { 
                        "bg-primary hover:bg-primary-accent": highlight, 
                        "bg-hero-background hover:bg-gray-200": !highlight 
                    })}
                    onClick={handleSubscription}
                    disabled={isLoading}
                >
                    {isLoading ? "Redirecting..." : "Get Started"}
                </button>
            </div>
            <div className="p-6 mt-1">
                <p className="font-bold mb-0">FEATURES</p>
                <p className="text-foreground-accent mb-5">Everything in basic, plus...</p>
                <ul className="space-y-4 mb-8">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                            <BsFillCheckCircleFill className="h-5 w-5 text-secondary mr-2" />
                            <span className="text-foreground-accent">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default PricingColumn