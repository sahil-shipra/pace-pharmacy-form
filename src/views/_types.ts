import type {
  FormSchema as AccountFormSchema,
} from './account/_components/form-schema';
import type { FormSchema as PaymentFormSchema } from './payment';
import type { FormSchema as ACKFormSchema } from './acknowledgements';
import type { FormSchema as MedicalFormSchema } from './medical-director';

export type {
  AccountFormSchema,
  PaymentFormSchema,
  ACKFormSchema,
  MedicalFormSchema,
};

export interface AccountRequest {
  account: AccountFormSchema;
  payment: PaymentFormSchema;
  medical: MedicalFormSchema;
  acknowledgements: ACKFormSchema;
  preferredLocation: Number
  documents: any
}
