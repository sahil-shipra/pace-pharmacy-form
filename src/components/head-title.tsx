function HeadTitle({
    title,
    description,
    children
}: {
    title: string
    description?: string
    children?: React.ReactNode;
}) {
    return (
        <div>
            <h1 className='text-[32px] leading-[40px] font-bold text-theme-green'>{title}</h1>
            {description && <p className='text-base font-medium text-foreground/80'>
                {description}
            </p>}
            {children}
        </div>
    )
}

export default HeadTitle