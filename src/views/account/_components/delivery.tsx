import HeadTitle from "@/components/head-title"
import { Controller, useFormContext } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function Delivery() {
  const form = useFormContext();
  return (
    <div className="pb-5">
      <div>
        <HeadTitle
          title={`Delivery Hours / Operating Hours (if applicable)`}
          description={`Please indicate your operating hours for deliveries. Include days you are closed or if you close early. As per the OCP 'Delivery of Prescriptions' Policy, we require a signature when delivering all prescription drugs.`}
        />
      </div>


      <div className="mt-4 space-y-5 px-1">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
            <Controller
              key={day}
              name={`delivery.hours.${day}`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor={`${day.toLowerCase()}-hours`} className="text-xl">
                    {day}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${day.toLowerCase()}-hours`}
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g., 9am to 5pm"
                    autoComplete="off"
                    className="h-12 md:text-lg"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          ))}
        </div>

        <Controller
          name="delivery.instruction"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="delivery-instruction" className="text-xl">
                {`Delivery Instruction (optional)`}
              </FieldLabel>
              <Input
                {...field}
                id="delivery-instruction"
                aria-invalid={fieldState.invalid}
                placeholder="eg., Leave with reception / Buzzer code  #1234 / Call upon arrival"
                autoComplete="off"
                className="h-12 md:text-lg"
              />
              <p className="py-0.5 text-sm font-medium text-foreground/80">Provide any special instruction for delivery</p>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

    </div>
  )
}

export default Delivery