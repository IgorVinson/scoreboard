'use client'
import { useState } from "react";
import clsx from "clsx";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { loadStripe } from "@stripe/stripe-js";

import { IPricing } from "@/types";

interface Props {
    tier: IPricing;
    highlight?: boolean;
}

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
            
            console.log("Creating checkout session with priceId:", priceId);
            
            // Make API request to your backend to create checkout session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId,
                    // Add user ID or email if available from auth context
                    // userId: currentUser?.id,
                    // userEmail: currentUser?.email,
                }),
            });

            // Check if the response is ok (status in the range 200-299)
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API error response:", errorData);
                throw new Error(errorData.error || `Server responded with status ${response.status}`);
            }

            const data = await response.json();
            console.log("API response data:", data);
            
            if (!data.sessionId) {
                throw new Error("No session ID returned from the server");
            }
            
            // Redirect to Stripe Checkout
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
            if (!stripe) {
                throw new Error("Failed to initialize Stripe");
            }
            
            const { error: redirectError } = await stripe.redirectToCheckout({ 
                sessionId: data.sessionId 
            });
            
            if (redirectError) {
                throw redirectError;
            }
        } catch (error) {
            console.error('Error initiating checkout:', error);
            setError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
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
                    {isLoading ? "Processing..." : "Get Started"}
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