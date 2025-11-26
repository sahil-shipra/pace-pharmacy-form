import HeadTitle from "@/components/head-title"
import { Fragment } from "react/jsx-runtime"
import { Label } from "@/components/ui/label"
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group"
import { Controller, useForm } from "react-hook-form"
import { Field, FieldLabel, FieldSet } from "@/components/ui/field"
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
    if (isErrorResponse(response)) throw response.error
    return response.data;
}

const formSchema = z.object({
    referenceCode: z.string().min(1, 'Reference Code is required.'),
    accountAuthorization: z.boolean().refine(val => val === true, {
        message: 'You must authorize your account.'
    }),
    prescriptionRequirement: z.enum(['withPrescription', 'withoutPrescription']),
    medicalDirectorEmail: z.string().default('')
});

// TypeScript Types (inferred from Zod schema)
export type FormSchema = z.infer<typeof formSchema>;

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
        mutationFn: submitApplication,
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
            accountAuthorization: false,
        },
    });

    const isApplicationSubmitted = useMemo(() => {
        if (!isSuccess || !data) return false;
        return (data.application.isSubmitted || !(data.application.isActive && !data.application.isExpired))
    }, [isSuccess, data])

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
                            You have been request to provide authorization for the professional account at Pace Pharmacy.
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
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="withoutPrescription" id="r1" />
                                                            <Label htmlFor="r1" className="font-normal text-lg cursor-pointer">
                                                                <p>
                                                                    I authorize <b className="text-theme-green"> {data.accountHolder} </b> account holder to order under my name for <b className="text-theme-green">{data.organizationName}</b> at their discretion,
                                                                    <strong>
                                                                        Without a written and signed prescription for each order.
                                                                    </strong>
                                                                </p>
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <RadioGroupItem value="withPrescription" id="r2" />
                                                            <Label htmlFor="r2" className="font-normal text-lg cursor-pointer">
                                                                I required a written and signed prescription for each order under my medical direction.
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </FieldSet>)}
                                        />
                                    </div>

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
                                                        I authorize Pace Pharmacy to process my account according to the terms above and confirm that I have read and understand all acknowledgements.
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