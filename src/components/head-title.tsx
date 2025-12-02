function HeadTitle({
    title,
    description,
    children,
    showAsterisk
}: {
    title: string
    description?: string
    children?: React.ReactNode;
    showAsterisk?: boolean
}) {
    return (
        <div>
            <h1 className='text-[32px] leading-[40px] font-bold text-theme-green'>{title}
                {showAsterisk && <span className="text-destructive">&nbsp;{`*`}</span>}
            </h1>
            {description && <p className='text-base font-medium text-foreground/80'>
                {description}
            </p>}
            {children}
        </div>
    )
}

export default HeadTitle