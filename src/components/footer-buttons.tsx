import { Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Link, useNavigate } from '@tanstack/react-router'

function FooterButtons({
    showBackButton,
    backButtonPath,
    nextButtonPath,
    nextButtonTitle,
    onSubmit,
    isLoading
}: {
    showBackButton?: boolean,
    backButtonPath?: string
    nextButtonPath?: string
    nextButtonTitle?: string
    onSubmit?: () => void
    isLoading?: boolean
}) {
    const navigate = useNavigate();

    const handleNext = () => {
        if (onSubmit) {
            onSubmit();
        }
        if (nextButtonPath) {
            navigate({ to: nextButtonPath });
        }
    };

    return (
        <div className='flex justify-end items-center my-5 gap-4'>
            {showBackButton && backButtonPath && (
                <Button type='button' variant={'secondary'} asChild className='h-10 w-28 text-lg font-medium cursor-pointer'>
                    <Link to={backButtonPath}> Back </Link>
                </Button>
            )}
            {nextButtonPath && !onSubmit ? (
                <Button disabled={isLoading} type='button' asChild className='h-10 min-w-28 text-lg font-medium bg-theme-green cursor-pointer'>
                    <Link to={nextButtonPath}>{nextButtonTitle ?? `Next`}</Link>
                </Button>
            ) : (
                <Button
                    className='h-10 min-w-28 text-lg font-medium bg-theme-green cursor-pointer'
                    onClick={handleNext}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className='animate-spin' /> : nextButtonTitle ?? `Next`}
                </Button>
            )}
        </div>
    )
}

export default FooterButtons