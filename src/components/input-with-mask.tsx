import { cn } from '@/lib/utils'
import { IMaskInput } from 'react-imask'
import type { ControllerRenderProps, FieldValues, Path } from 'react-hook-form'

interface InputWithMaskProps<TFieldValues extends FieldValues = FieldValues> {
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>
    fieldState: {
        invalid: boolean
    }
    mask?: any
    placeholder?: string
    id?: string
    className?: string
    definitions?: any
}

function InputWithMask<TFieldValues extends FieldValues = FieldValues>({
    field,
    fieldState,
    mask = "(000) 000-0000",
    placeholder = "Phone Number",
    id,
    className,
    definitions
}: InputWithMaskProps<TFieldValues>) {
    return (
        <IMaskInput
            mask={mask}
            placeholder={placeholder}
            onAccept={(value) => field.onChange(value)}
            {...field}
            ref={field.ref}
            id={id}
            aria-invalid={fieldState.invalid}
            autoComplete="off"
            definitions={definitions}
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                "h-12 md:text-lg",
                className
            )}
        />
    )
}

export default InputWithMask