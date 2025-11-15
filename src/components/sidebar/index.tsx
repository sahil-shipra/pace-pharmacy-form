import { SESSION_KEYS } from "@/constants"
import { cn } from "@/lib/utils"
import { Link, useLocation } from '@tanstack/react-router'
import { Check } from "lucide-react"

function SideBar() {
    const location = useLocation()
    const steps = [
        {
            title: 'Location',
            path: '/location',
            key: SESSION_KEYS.LOCATION_KEY
        },
        {
            title: 'Account Info.',
            path: '/account',
            key: SESSION_KEYS.ACCOUNT_KEY
        },
        {
            title: 'Payment',
            path: '/payment',
            key: SESSION_KEYS.PAYMENT_KEY
        },
        {
            title: 'Acknowledgements',
            path: '/acknowledgements',
            key: SESSION_KEYS.ACK_KEY
        },
        {
            title: 'Medical Director',
            path: '/medical-director',
            key: SESSION_KEYS.MEDICAL_DIRECTOR_KEY
        },
        {
            title: 'Review',
            path: '/review',
            key: 'review'
        },
    ]

    const checkActiveRoute = (path: string): boolean => {
        return location.pathname === path;
    }

    const checkSessionHasData = (key: string) => {
        const sessionValue = sessionStorage.getItem(key);
        try {
            if (sessionValue !== null) {
                const parsed = JSON.parse(sessionValue);
                // Treat empty objects, arrays, null, or empty string as "no data"
                if (
                    parsed === null ||
                    parsed === "" ||
                    (typeof parsed === "object" && Object.keys(parsed).length === 0) ||
                    (Array.isArray(parsed) && parsed.length === 0)
                ) {
                    return false;
                }
                return true;
            }
            return false;
        } catch {
            // If not JSON, fallback to non-strict check
            return !!sessionValue;
        }
    }

    return (
        <div className="border-r pr-5 hidden lg:block">
            <ol className="relative text-gray-500 border-s border-gray-200 dark:border-gray-700 ">
                {steps.map((step) => {
                    const isActive = checkActiveRoute(step.path)
                    const hasData = checkSessionHasData(step.key)
                    return (
                        <li className="mb-10 ms-6" key={step.key}>
                            <span className={cn("absolute flex items-center justify-center size-8  rounded-full -start-4 ring-4 ring-white bg-[#A5A5A5]",
                                isActive && "bg-white border-theme-green border-[3px]",
                                hasData && "bg-theme-green"
                            )}>
                                {hasData ?
                                    <Check className="text-white" />
                                    : <span className={cn("size-1.5 rounded-full bg-white",
                                        isActive && "bg-theme-green"
                                    )}></span>}
                            </span>
                            <h3 className={cn("pt-1 font-medium leading-6 text-lg",
                                isActive && "text-theme-green font-bold"
                            )}>{hasData ?
                                <Link to={step.path}> {step.title} </Link>
                                : step.title}</h3>
                        </li>
                    )
                })}
            </ol>

        </div>
    )
}

export default SideBar