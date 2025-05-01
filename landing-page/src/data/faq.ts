import { IFAQ } from "@/types";
import { siteDetails } from "./siteDetails";

export const faqs: IFAQ[] = [
    {
        question: `Is ${siteDetails.siteName} secure?`,
        answer: 'Absolutely. We use industry-standard encryption to protect your data and never share your personal information with third parties. Your metrics and achievements are always kept private and secure.',
    },
    {
        question: `Can I use ${siteDetails.siteName} on multiple devices?`,
        answer: 'Yes! Your Scoreboard account syncs seamlessly across all your devices - smartphone, tablet, and computer, allowing you to track your metrics wherever you are.',
    },
    {
        question: 'What types of metrics can I track?',
        answer: `${siteDetails.siteName} supports tracking any custom metric you want to monitor. Whether it's fitness goals, work productivity, learning progress, or personal habits, our flexible system adapts to your needs.`
    },
    {
        question: 'How does the achievement tracking work?',
        answer: 'Our achievement system automatically recognizes when you hit milestones based on your tracked metrics. You can also manually log achievements and add notes to document your progress journey.',
    },
    {
        question: 'What if I need help using the tracking features?',
        answer: 'Our support team is available via email to help with any questions. We also provide comprehensive in-app tutorials and documentation to help you make the most of your metrics tracking experience.'
    }
];