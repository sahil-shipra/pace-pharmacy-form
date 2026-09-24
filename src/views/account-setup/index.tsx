import HeadTitle from "@/components/head-title"
import { Fragment } from "react/jsx-runtime"
import { Label } from "@/components/ui/label"
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group"
import { Controller, useForm } from "react-hook-form"
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Navigate, useNavigate, useParams } from "@tanstack/react-router"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getApplication, submitApplication } from "./_api"
import { isErrorResponse } from "@/types/common.api"
import { CheckCircle, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import useSessionStorage from "@/hooks/use-session-storage"

async function getApplicationData(code: string) {
    const response = await getApplication(code);
    if (isErrorResponse(response)) throw new Error(response.message);
    return response.data;
}

const formSchema = z.object({
    referenceCode: z.string().min(1, 'Reference Code is required.'),
    // Medical Director Confirmations
    confirmation1: z.boolean().refine(val => val === true, {
        message: 'You must confirm this item.'
    }),
    confirmation2: z.boolean().refine(val => val === true, {
        message: 'You must confirm this item.'
    }),
    confirmation3: z.boolean().refine(val => val === true, {
        message: 'You must confirm this item.'
    }),
    // Prescription Requirement
    prescriptionRequirement: z.enum(['withPrescription', 'withoutPrescription']),
    authorizedIndividuals: z.string().optional().default(''),
    // Final authorization
    accountAuthorization: z.boolean().refine(val => val === true, {
        message: 'You must provide your authorization.'
    }),
    medicalDirectorEmail: z.string().default('')
}).refine(
    (data) => {
        if (data.prescriptionRequirement === 'withoutPrescription') {
            return data.authorizedIndividuals && data.authorizedIndividuals.trim().length > 0;
        }
        return true;
    },
    {
        message: 'Please enter the name(s) of authorized individuals.',
        path: ['authorizedIndividuals'],
    }
);

// TypeScript Types (inferred from Zod schema)
export type FormSchema = z.infer<typeof formSchema>;

async function postApplication(data: FormSchema) {
    const response = await submitApplication(data);
    if (isErrorResponse(response)) throw new Error(response.message);
    return response;
}

function AccountSetupRouteComponent() {
    const [_, SetIsSubmitted] = useSessionStorage<boolean | null>(
        'AuthorizationSubmitted',
        null
    );

    const { code } = useParams({ from: "/_account/account-setup/$code/" })
    const navigate = useNavigate();

    const { data, isLoading, isSuccess, isError } = useQuery({
        queryKey: ['medical-director-authorization', code],
        queryFn: () => getApplicationData(code),
        enabled: Boolean(code),
        refetchOnWindowFocus: false
    })

    const { mutate: SubmitApplication, isPending } = useMutation({
        mutationKey: ['medical-director-authorization', code],
        mutationFn: postApplication,
        onSuccess: () => {
            SetIsSubmitted(true)
            navigate({
                to: "/account-setup/$code/submitted",
                params: { code }
            });
        }
    })

    const methods = useForm<FormSchema>({
        resolver: zodResolver(formSchema as any),
        defaultValues: {
            referenceCode: code,
            confirmation1: false,
            confirmation2: false,
            confirmation3: false,
            authorizedIndividuals: '',
            accountAuthorization: false,
        },
    });

    const isApplicationSubmitted = useMemo(() => {
        if (!isSuccess || !data) return false;
        return (data.application.isSubmitted || !(data.application.isActive && !data.application.isExpired))
    }, [isSuccess, data])

    const prescriptionRequirement = methods.watch('prescriptionRequirement');

    const onSubmit = (formData: FormSchema) => {
        SubmitApplication({ ...formData, medicalDirectorEmail: data?.medicalDirectorEmail || '' })
    };
    if (!code || code === undefined) <Navigate to={'/'} />

    if (isLoading) {
        return (
            <div className="w-full h-[calc(100dvh-350px)] flex justify-center items-center">
                <Loader2 className="animate-spin size-20 text-theme-green" />
            </div>
        )
    }

    if (isError) {
        return <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-2">Application Not Found</h2>
            <p className="text-gray-600 mb-6 text-lg">
                We couldn't find an application with the reference code <span className="underline font-bold">{code}</span>.
                Please double-check the code and try again.
            </p>
        </div>
    }

    if (isSuccess)
        return (
            <Fragment>
                <HeadTitle title="Medical Director Authorization" />
                <div className="p-3 my-3 mb-5 text-theme-green rounded-lg bg-theme-green-50 text-lg font-bold" role="alert">
                    {isApplicationSubmitted ?
                        <p className="flex justify-start items-center gap-1">
                            <CheckCircle /> You have already provided authorization for the professional account at Pace Pharmacy.
                        </p>
                        : <p>
                            You have been requested to provide authorization for the professional account at Pace Pharmacy.
                        </p>}
                </div>
                <div>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        <section className="mb-6 space-y-5">
                            <h2 className="text-xl font-normal text-theme-green">
                                Account Information (for your review)
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-lg mt-5">
                                <div className="font-medium">Account Holder :</div>
                                <div className="md:col-span-2">
                                    {data.accountHolder}
                                </div>

                                <div className="font-medium">Clinic / Organization :</div>
                                <div className="md:col-span-2">
                                    {data.organizationName}
                                </div>

                                <div className="font-medium">Your Name :</div>
                                <div className="md:col-span-2">
                                    {data.medicalDirectorName}
                                </div>
                            </div>

                            {!isApplicationSubmitted &&
                                <Fragment>
                                    {/* ── Medical Director Confirmations ── */}
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-normal text-theme-green">
                                            Medical Director Confirmations
                                        </h2>
                                        <p className="text-base text-foreground/80">
                                            For medications ordered or prescribed under my medical direction, I confirm that:
                                        </p>

                                        <Controller
                                            name="confirmation1"
                                            control={methods.control}
                                            render={({ field, fieldState }) => (
                                                <Field orientation="horizontal">
                                                    <Checkbox
                                                        id="confirmation-1"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <FieldLabel
                                                        htmlFor="confirmation-1"
                                                        className={cn("font-normal text-lg cursor-pointer", fieldState.invalid && 'text-destructive')}
                                                    >
                                                        Individuals administering medications have been appropriately trained and assessed as competent to administer the medications provided.
                                                    </FieldLabel>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="confirmation2"
                                            control={methods.control}
                                            render={({ field, fieldState }) => (
                                                <Field orientation="horizontal">
                                                    <Checkbox
                                                        id="confirmation-2"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <FieldLabel
                                                        htmlFor="confirmation-2"
                                                        className={cn("font-normal text-lg cursor-pointer", fieldState.invalid && 'text-destructive')}
                                                    >
                                                        Where an individual is not independently authorized to perform a controlled act, appropriate delegation and documentation are in place in accordance with applicable legislation and the requirements of your regulatory college.
                                                    </FieldLabel>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </Field>
                                            )}
                                        />

                                        <Controller
                                            name="confirmation3"
                                            control={methods.control}
                                            render={({ field, fieldState }) => (
                                                <Field orientation="horizontal">
                                                    <Checkbox
                                                        id="confirmation-3"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <FieldLabel
                                                        htmlFor="confirmation-3"
                                                        className={cn("font-normal text-lg cursor-pointer", fieldState.invalid && 'text-destructive')}
                                                    >
                                                        Appropriate emergency training, procedures, equipment and supplies are in place for the medications and procedures being provided.
                                                    </FieldLabel>
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]} />
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    {/* ── Prescription Requirement ── */}
                                    <div>
                                        <Controller
                                            name="prescriptionRequirement"
                                            control={methods.control}
                                            render={({ field, fieldState }) => (
                                                <FieldSet aria-invalid={fieldState.invalid}>
                                                    <h2 className={cn("text-xl font-normal text-theme-green", fieldState.invalid && 'text-destructive')}>
                                                        Prescription Requirement <span className="text-destructive">*</span>
                                                    </h2>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value}>
                                                        <div className="flex items-start gap-3">
                                                            <RadioGroupItem value="withoutPrescription" id="r1" className="mt-1" />
                                                            <div className="flex-1">
                                                                <Controller
                                                                    name="authorizedIndividuals"
                                                                    control={methods.control}
                                                                    render={({ field: innerField, fieldState: innerFieldState }) => (
                                                                        <>
                                                                            <label htmlFor="r1" className="font-normal text-lg cursor-pointer leading-relaxed">
                                                                                I authorize the following individuals{' '}
                                                                                <input
                                                                                    {...innerField}
                                                                                    id="authorized-individuals"
                                                                                    aria-invalid={innerFieldState.invalid}
                                                                                    placeholder="name(s)"
                                                                                    autoComplete="off"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    onFocus={() => methods.setValue('prescriptionRequirement', 'withoutPrescription')}
                                                                                    className={cn(
                                                                                        "inline border-0 border-b-2 outline-none bg-transparent text-lg min-w-[180px] px-1 mx-0.5 align-baseline",
                                                                                        innerFieldState.invalid ? "border-destructive placeholder:text-destructive/60" : "border-foreground/60 focus:border-theme-green"
                                                                                    )}
                                                                                />
                                                                                {' '}to place orders under my name for{' '}
                                                                                <b className="text-theme-green">{data.organizationName}</b>,{' '}
                                                                                without a signed prescription for each order.
                                                                            </label>
                                                                            {innerFieldState.invalid && prescriptionRequirement === 'withoutPrescription' && (
                                                                                <span className="text-destructive text-sm block mt-1">
                                                                                    {innerFieldState.error?.message}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="withPrescription" id="r2" />
                                                            <Label htmlFor="r2" className="font-normal text-lg cursor-pointer">
                                                                I require a signed prescription for each order.
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </FieldSet>
                                            )}
                                        />
                                    </div>

                                    {/* ── Final Authorization ── */}
                                    <div>
                                        <Controller
                                            name="accountAuthorization"
                                            control={methods.control}
                                            render={({ field, fieldState }) => (
                                                <Field orientation="horizontal">
                                                    <Checkbox
                                                        id="account-authorization"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <FieldLabel
                                                        htmlFor="account-authorization"
                                                        className={cn("font-normal text-lg cursor-pointer", fieldState.invalid && 'text-destructive')}
                                                    >
                                                        I authorize Pace Pharmacy to process{' '}
                                                        <b className="text-theme-green">{data.organizationName}</b>{' '}
                                                        according to the terms above and confirm that I have read and understand all acknowledgements.
                                                    </FieldLabel>
                                                </Field>
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-end items-center gap-2">
                                        <Button className='h-10 min-w-28 text-lg font-medium bg-theme-green cursor-pointer'>
                                            {isPending ? <Loader2 className="animate-spin" /> : `Submit Application`}
                                        </Button>
                                    </div>
                                </Fragment>
                            }
                        </section>
                    </form>
                </div>
            </Fragment>
        )

    return null;
}

export default AccountSetupRouteComponent
