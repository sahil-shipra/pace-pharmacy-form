import FooterButtons from "@/components/footer-buttons";
import HeadTitle from "@/components/head-title";
import { SESSION_KEYS } from "@/constants";
import useSessionStorage from "@/hooks/use-session-storage";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAccount,
  getErrorMessage,
  getSafeSubmitErrorContext,
  toAccountSubmitError,
} from "./_api";
import type {
  AccountFormSchema,
  ACKFormSchema,
  MedicalFormSchema,
  PaymentFormSchema,
} from "./_types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Fragment, useEffect, useState } from "react";
import { isErrorResponse } from "@/types/common.api";
import { TriangleAlert } from "lucide-react";
import useDocumentsStore from "./account/_components/documents-store";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const postAccount = async (data: FormData) => {
  const res = await createAccount(data);
  if (isErrorResponse(res)) throw new Error(res.message);
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

const PaymentMethodLabel: Record<string, string> = {
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
  const [rawError, setRawError] = useState<unknown>(null);
  const [sentryEventId, setSentryEventId] = useState<string | null>(null);
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

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

  const buildSafeContext = (err: unknown, message: string) =>
    getSafeSubmitErrorContext(err, message, {
      documentCount: documents?.length ?? 0,
      // Payment method only (e.g. visa) — never card number / CVV / name.
      paymentMethod: paymentInformation?.paymentMethod,
      preferredLocation,
      hasAccountDraft: Boolean(accountInformation),
      hasPaymentDraft: Boolean(paymentInformation),
      hasAckDraft: Boolean(ackInformation),
      hasMedicalDraft: Boolean(medicalInformation),
    });

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
    onError: (res, variables) => {
      const json = variables.get("json");

      const data = JSON.parse(json as string);

      const email = data.account.emailAddress;

      const firstName = data.account.account.firstName;
      const lastName = data.account.account.lastName;
      const name = `${firstName} ${lastName}`;

      onChangeErrorDialog(true);
      const message = getErrorMessage(res);
      setError(message);
      setRawError(res);
      setReportState('idle');

      const safeContext = buildSafeContext(res, message);
      const eventId = Sentry.captureException(toAccountSubmitError(res, message), {
        tags: {
          feature: "account-submit",
          api_endpoint: "/account",
          http_status: safeContext.httpStatus != null
            ? String(safeContext.httpStatus)
            : "none",
        },
        user: {
          name,
          email,
        },
        contexts: {
          account_submit: safeContext,
        },
      });
      setSentryEventId(eventId);

      console.error("Request failed:", res);
    }
  });

  const handleReportProblem = () => {
    if (reportState === 'sending' || reportState === 'sent') return;

    setReportState('sending');
    try {
      const safeContext = buildSafeContext(rawError, error);
      Sentry.captureFeedback(
        {
          message: `User reported a problem submitting the account form: ${error || "Unknown error"}`,
          url: window.location.href,
          source: "review-report-button",
          associatedEventId: sentryEventId ?? undefined,
          tags: {
            feature: "account-submit",
            user_reported: "true",
            api_endpoint: "/account",
            http_status: safeContext.httpStatus != null
              ? String(safeContext.httpStatus)
              : "none",
          },
        },
        {
          captureContext: {
            contexts: {
              account_submit: safeContext,
            },
          },
        }
      );
      setReportState('sent');
    } catch (reportErr) {
      console.error("Failed to send Sentry feedback:", reportErr);
      setReportState('failed');
    }
  };

  const redirectForMissingDocuments = () => {
    toast.error(
      "Please upload your license documents before submitting. If you refreshed the page, upload them again on the Account step.",
      { className: "border border-red-500 text-red-600" }
    );
    navigate({ to: "/account" });
  };

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

    // Files live only in Zustand — session restore cannot bring them back
    if (!documents?.length) {
      redirectForMissingDocuments();
      return false;
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
      if (!documents?.length) {
        redirectForMissingDocuments();
        return;
      }

      if (accountInformation.sameAsBilling) {
        accountInformation.shippingAddress = accountInformation.billingAddress
      }

      const formData = new FormData();

      documents.forEach((file) => {
        if (file) {
          formData.append('documents', file);
        }
      });

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

              {(!medicalInformation.isAlsoMedicalDirector) &&
                <Fragment>
                  <div className="font-medium">Director Email :</div>
                  <div className="sm:col-span-2">{medicalInformation.email}</div>
                </Fragment>
              }

              <div className="font-medium">License :</div>
              <div className="sm:col-span-2">{medicalInformation.licenseNo || '-'}</div>

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
              <div className="flex justify-start items-center gap-2 font-normal text-destructive">
                <TriangleAlert /> Something went wrong!
              </div>
            </DialogTitle>
            <DialogDescription className="hidden">

            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-2 mb-4 text-lg text-destructive rounded-xl" role="alert">
            {error}
          </div>

          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              variant={"link"}
              onClick={handleReportProblem}
              disabled={reportState === 'sending' || reportState === 'sent'}
              className="text-sm text-red-600 underline hover:text-red-700 disabled:no-underline disabled:opacity-60 cursor-pointer p-0 m-0"
            >
              {reportState === 'sending'
                ? 'Sending report…'
                : reportState === 'sent'
                  ? 'Problem reported'
                  : 'Report this problem'}
            </Button>
            {reportState === 'sent' && (
              <p className="text-xs text-muted-foreground">
                Thanks — your report was sent
                {sentryEventId ? ` (ref: ${sentryEventId.slice(0, 8)})` : ''}.
              </p>
            )}
            {reportState === 'failed' && (
              <p className="text-xs text-destructive">
                Couldn't send the report. Please try again.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default ReviewRouteComponent;
