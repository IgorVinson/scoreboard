import { FiBarChart2, FiBriefcase, FiCalendar, FiCheckSquare, FiClipboard, FiLayout, FiLock, FiPieChart, FiShield, FiTarget, FiTrendingUp, FiUser } from "react-icons/fi";

import { IBenefit } from "@/types"

export const benefits: IBenefit[] = [
    {
        title: "Metric Tracking",
        description: "Take the guesswork out of monitoring your progress. Our intelligent tracking system adapts to your goals and helps you stay on track.",
        bullets: [
            {
                title: "Smart Categories",
                description: "Automatically organizes your metrics for clear performance insights.",
                icon: <FiBarChart2 size={26} />
            },
            {
                title: "Customizable Objectives",
                description: "Set and track goals that matter to your personal growth.",
                icon: <FiTarget size={26} />
            },
            {
                title: "Progress Analysis",
                description: "Get ahead with performance forecasts and achievement alerts.",
                icon: <FiTrendingUp size={26} />
            }
        ],
        imageSrc: "/images/mockup-1.webp"
    },
    {
        title: "Daily & Weekly Reports",
        description: "Stay informed with comprehensive performance insights. Scoreboard makes tracking progress accessible and straightforward.",
        bullets: [
            {
                title: "Daily Summaries",
                description: "Review your achievements and areas for improvement each day.",
                icon: <FiClipboard size={26} />
            },
            {
                title: "Weekly Overviews",
                description: "Analyze trends and patterns with detailed weekly performance reports.",
                icon: <FiLayout size={26} />
            },
            {
                title: "Visual Analytics",
                description: "Track your progress with easy-to-understand metrics and visualizations.",
                icon: <FiPieChart size={26} />
            }
        ],
        imageSrc: "/images/mockup-2.webp"
    },
    {
        title: "Notes & Achievement Tracking",
        description: "Capture insights and celebrate wins. Record daily notes and keep track of all your accomplishments in one secure place.",
        bullets: [
            {
                title: "Daily Journal",
                description: "Document your thoughts, strategies, and observations as you progress.",
                icon: <FiCalendar size={26} />
            },
            {
                title: "Achievement Milestones",
                description: "Mark and celebrate your wins with our milestone tracking system.",
                icon: <FiCheckSquare size={26} />
            },
            {
                title: "Secure Data Storage",
                description: "Your personal information and progress data is protected with advanced security.",
                icon: <FiShield size={26} />
            }
        ],
        imageSrc: "/images/mockup-1.webp"
    },
]