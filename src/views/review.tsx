import FooterButtons from "@/components/footer-buttons";
import HeadTitle from "@/components/head-title";
import { SESSION_KEYS } from "@/constants";
import useSessionStorage from "@/hooks/use-session-storage";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount } from "./_api";
import type {
  AccountFormSchema,
  ACKFormSchema,
  MedicalFormSchema,
  PaymentFormSchema,
} from "./_types";
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import { isErrorResponse } from "@/types/common.api";
import axios from "axios";
import { TriangleAlert } from "lucide-react";
import useDocumentsStore from "./account/_components/documents-store";

const postAccount = async (data: FormData) => {
  const res = await createAccount(data);
  if (isErrorResponse(res)) throw res.error;
  return res;
};

const ProvincesEnum = {
  alberta: "Alberta",
  british_columbia: "British Columbia",
  manitoba: "Manitoba",
  new_brunswick: "New Brunswick",
  newfoundland_and_labrador: "Newfoundland and Labrador",
  nova_scotia: "Nova Scotia",
  ontario: "Ontario",
  prince_edward_island: "Prince Edward Island",
  quebec: "Quebec",
  saskatchewan: "Saskatchewan",
};

export const PaymentMethodLabel: Record<string, string> = {
  "visa": 'VISA',
  "mastercard": 'Master Card',
  "amex": 'American Express',
  "bank_transfer": 'E-Transfer'
};

function ReviewRouteComponent() {
  // Access the client
  const [_code, setCode] = useSessionStorage<string | null>(
    'referenceCode',
    null
  );

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showErrorDialog, onChangeErrorDialog] = useState(false)
  const [error, setError] = useState('')
  // Mutations
  const { mutate: onSubmit, ...mutation } = useMutation({
    mutationFn: postAccount,
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      sessionStorage.clear();

      setCode(data.data.referenceCode)
      navigate({
        to: "/submitted", search: {
          code: data.data.referenceCode
        }
      });
    },
    onError: (res) => {
      onChangeErrorDialog(true);
      const err = res
      if (axios.isAxiosError(err)) {
        // Now TypeScript knows it's AxiosError
        const status = err.response?.status;
        // const data = err.response?.data.error;

        if (status === 409) {
          setError(`This email address is already registered. Please use a different email or log in.`)
          toast.error(
            `This email address is already registered. Please use a different email or log in.`,
            { className: "border border-red-500 text-red-600" }
          );
        }
      } else {
        // Non-Axios error
        console.error("General error:", err.message);
        toast.error(err.message, {
          className: "border border-red-500 text-red-600"
        });
      }
    }
  });

  const [accountInformation] = useSessionStorage<AccountFormSchema | null>(
    SESSION_KEYS.ACCOUNT_KEY,
    null
  );

  const [paymentInformation] = useSessionStorage<PaymentFormSchema | null>(
    SESSION_KEYS.PAYMENT_KEY,
    null
  );

  const [ackInformation] = useSessionStorage<ACKFormSchema | null>(
    SESSION_KEYS.ACK_KEY,
    null
  );

  const [medicalInformation] = useSessionStorage<MedicalFormSchema | null>(
    SESSION_KEYS.MEDICAL_DIRECTOR_KEY,
    null
  );

  const [preferredLocation] = useSessionStorage<string | null>(
    SESSION_KEYS.LOCATION_KEY,
    null
  );

  const { documents } = useDocumentsStore();

  const checkForData = () => {
    const dataChecks = [
      // { key: preferredLocation, message: 'Preferred location is not set yet.', route: '/location' },
      { key: accountInformation, message: 'Account information is not set yet.', route: '/account' },
      { key: paymentInformation, message: 'Payment information is not set yet.', route: '/payment' },
      { key: ackInformation, message: 'Acknowledgment information is not set yet.', route: '/acknowledgements' },
      { key: medicalInformation, message: 'Medical information is not set yet.', route: '/medical-director' }
    ];

    for (const { key, message, route } of dataChecks) {
      if (!key) {
        console.log(message);
        navigate({ to: route });
        return false;
      }
    }

    return true;
  };



  useEffect(() => {
    checkForData();

    return () => {

    }
  }, [])


  const onFormSubmit = () => {

    if (
      preferredLocation &&
      accountInformation &&
      paymentInformation &&
      medicalInformation &&
      ackInformation
    ) {

      if (accountInformation.sameAsBilling) {
        accountInformation.shippingAddress = accountInformation.billingAddress
      }

      const formData = new FormData();

      if (documents && documents.length > 0) {
        // Append images from the state to the FormData (files only, not previews)
        documents.forEach((file) => {
          if (file) {
            formData.append('documents', file);
          }
        });
      }

      formData.append("json", JSON.stringify({
        account: accountInformation,
        payment: paymentInformation,
        medical: medicalInformation,
        acknowledgements: ackInformation,
        preferredLocation: Number(preferredLocation),
        documents: formData
      }));
      onSubmit(formData);
    } else {
      console.error("Account information missing. Cannot submit form.");
    }
  };

  return (
    <div>
      <div>
        <HeadTitle title={`Review & Submit`} />
      </div>

      <div className="mt-4">
        {/* Account Information */}

        {accountInformation && (
          <section className="mb-6">
            <h3 className="font-semibold text-theme-green mb-2">
              Account Information
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <div className="font-medium">Account Holder :</div>
              <div className="sm:col-span-2">
                {accountInformation.account.holderName}
              </div>

              <div className="font-medium">Designation / License :</div>
              <div className="sm:col-span-2">
                {accountInformation.account.designation}
              </div>

              <div className="font-medium">Clinic / Organization :</div>
              <div className="sm:col-span-2">
                {accountInformation.account.organizationName}
              </div>

              <div className="font-medium">Address :</div>
              <div className="sm:col-span-2 truncate">
                {accountInformation.billingAddress.addressLine_1},
                {accountInformation.billingAddress.addressLine_2},
                {accountInformation.billingAddress.city},
                {ProvincesEnum[accountInformation.billingAddress.province as keyof typeof ProvincesEnum]},
                {accountInformation.billingAddress.postalCode}
              </div>

              <div className="font-medium">Phone :</div>
              <div className="sm:col-span-2">{accountInformation.phone}</div>

              <div className="font-medium">Email Address :</div>
              <div className="sm:col-span-2">
                {accountInformation.emailAddress}
              </div>
            </div>
          </section>
        )}

        {/* Payment Information */}
        {paymentInformation && (
          <section className="mb-6">
            <h3 className="font-semibold text-theme-green mb-2">
              Payment Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <div className="font-medium">Payment Method :</div>
              <div className="sm:col-span-2">
                {PaymentMethodLabel[paymentInformation.paymentMethod]}
              </div>

              <div className="font-medium">Card Number :</div>
              <div className="sm:col-span-2">{paymentInformation.cardNumber}</div>

              <div className="font-medium">Card Holder Name :</div>
              <div className="sm:col-span-2">{paymentInformation.nameOnCard}</div>

              <div className="font-medium">Expiry Date :</div>
              <div className="sm:col-span-2">
                {paymentInformation.cardExpiryDate}
              </div>

              <div className="font-medium">CVV :</div>
              <div className="sm:col-span-2">{paymentInformation.cvv}</div>
            </div>
          </section>
        )}

        {/* Acknowledgements */}
        {ackInformation && (
          <section className="mb-6">
            <h3 className="font-semibold text-theme-green mb-2">
              Acknowledgements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <div className="font-medium">Financial Responsibility :</div>
              <div className="sm:col-span-2">
                {ackInformation.nameToAcknowledge}
              </div>

              <div className="font-medium">Terms Acknowledgement :</div>
              <div className="sm:col-span-2">
                {ackInformation.acknowledgementConsent
                  ? "Accepted"
                  : "Declined"}
              </div>
            </div>
          </section>
        )}

        {/* Medical Director Information */}
        {medicalInformation && (
          <section className="mb-6">
            <h3 className="font-semibold text-theme-green mb-2">
              Medical Director Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <div className="font-medium">Director Name :</div>
              <div className="sm:col-span-2">{medicalInformation.name}</div>

              <div className="font-medium">License :</div>
              <div className="sm:col-span-2">{medicalInformation.licenseNo}</div>

              <div className="font-medium">Single Person Application :</div>
              <div className="sm:col-span-2">
                {medicalInformation.isAlsoMedicalDirector ? "Yes" : "No"}
              </div>
            </div>
          </section>
        )}
      </div>

      <FooterButtons
        showBackButton
        backButtonPath="/medical-director"
        onSubmit={onFormSubmit}
        nextButtonTitle="Submit Form"
        isLoading={mutation.isPending}
      />

      <Dialog open={showErrorDialog} onOpenChange={onChangeErrorDialog}>
        <DialogContent className="font-enzyme">
          <DialogHeader>
            <DialogTitle>
              <div className="flex justify-start items-center gap-2 font-normal">
                <TriangleAlert /> Something went wrong!
              </div>
            </DialogTitle>
            <DialogDescription className="hidden">

            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-2 mb-4 text-lg text-destructive rounded-xl" role="alert">
            {error}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default ReviewRouteComponent;
