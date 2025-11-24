
import { z } from 'zod';

// Zod v4 Schema
const accountSchema = z.object({
    holderName: z.string().min(1, 'Holder name is required'),
    designation: z.string().min(1, 'Designation is required'),
    organizationName: z.string().min(1, 'Organization name is required'),
    contactPerson: z.string().optional().default(''),
});

const addressSchema = z.object({
    addressLine_1: z.string().min(1, 'Address line 1 is required'),
    addressLine_2: z.string(),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
});

const deliveryHoursSchema = z.object({
    Monday: z.string().optional().default(''),
    Tuesday: z.string().optional().default(''),
    Wednesday: z.string().optional().default(''),
    Thursday: z.string().optional().default(''),
    Friday: z.string().optional().default(''),
});

const deliverySchema = z.object({
    instruction: z.string().optional().default(''),
    hours: deliveryHoursSchema.optional().default({
        Monday: '',
        Tuesday: '',
        Wednesday: '',
        Thursday: '',
        Friday: ''
    }),
});

// For file validation in Zod v4
export const fileSchema = z.custom<File>((val) => val instanceof File, {
    message: 'Expected a File object',
});

export const formSchema = z.object({
    account: accountSchema,
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    // documents: z
    //     .any()
    //     .optional(),
    documents: z
        .array(z.union([z.instanceof(File), z.instanceof(Blob)]))
        .min(1, "Upload at least one document"),
    delivery: deliverySchema.optional(),
    phone: z.string().min(1, 'Phone is required'),
    emailAddress: z
        .email('A valid Email Address is required')
        .min(1, 'Email Address is required'),
    fax: z.string().optional().default(''),
    sameAsBilling: z.boolean().optional().default(false),
});

// TypeScript Types (inferred from Zod schema)
export type FormSchema = z.infer<typeof formSchema>;
export type AccountInfo = z.infer<typeof accountSchema>;
export type AddressInfo = z.infer<typeof addressSchema>;
export type DeliveryInfo = z.infer<typeof deliverySchema>;

// Default values matching the schema
export const defaultFormValues: Partial<FormSchema> = {
    account: {
        holderName: '',
        designation: '',
        organizationName: '',
        contactPerson: '',
    },
    billingAddress: {
        addressLine_1: '',
        addressLine_2: '',
        city: '',
        province: '',
        postalCode: '',
    },
    shippingAddress: {
        addressLine_1: '',
        addressLine_2: '',
        city: '',
        province: '',
        postalCode: '',
    },
    documents: [],
    delivery: {
        instruction: '',
        hours: {
            Monday: '',
            Tuesday: '',
            Wednesday: '',
            Thursday: '',
            Friday: ''
        },
    },
};