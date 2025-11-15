import HeadTitle from "@/components/head-title"
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useFormContext } from "react-hook-form"
import { useRef } from "react"
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

function Documents() {
  const form = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: File[] | null) => void) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      onChange(null);
      return;
    }

    const fileArray = Array.from(files);
    const invalidFiles: string[] = [];

    // Validate file sizes
    fileArray.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      }
    });

    if (invalidFiles.length > 0) {
      form.setError('documents', {
        type: 'manual',
        message: `File size exceeds 10MB: ${invalidFiles.join(', ')}`
      });
      return;
    }

    // Clear any previous errors
    form.clearErrors('documents');
    onChange(fileArray);
  };

  const selectedFiles = form.watch('documents') as File[] | null | undefined;

  return (
    <div className="pb-5">
      <div>
        <HeadTitle
          title={`Documents`}
          description={`Please upload any required documents. (eg., Signed Medical Director form, Professional License etc...)`}
        />
      </div>
      <div className="mt-4 px-1">
        <Controller
          name="documents"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <div className={cn("flex items-center justify-center w-full border rounded-md p-2",
                (selectedFiles && selectedFiles.length > 0) && "justify-between"
              )}>
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-1">
                    {selectedFiles.map((file, index) => {
                      if (index < 3) return (

                        <div
                          key={index}
                          className="bg-theme-green-100 p-2.5 w-fit flex justify-start items-center gap-1 rounded-lg"
                        >
                          <span className="max-w-40 truncate">{file.name}</span>
                          <span className="text-xs pl-0.5">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>

                          <button
                            type="button"
                            onClick={() => console.log(file)}
                            className="p-0.5 hover:text-red-600 transition-colors"
                          >
                            <X className="size-5" />
                          </button>
                        </div>


                      )
                    })}
                  </div>
                )}
                <label htmlFor="dropzone-file" className="cursor-pointer">
                  <Button
                    className="z-0 cursor-pointer"
                    type="button"
                    variant={'secondary'}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload documents
                  </Button>
                </label>
                <Input
                  ref={fileInputRef}
                  id="dropzone-file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="hidden"
                  multiple={true}
                  onChange={(e) => handleFileChange(e, field.onChange)}
                />
              </div>
              <p className="py-0.5 text-sm font-medium text-foreground/80">PDF, JPG, PNG (Max 10MB per file)</p>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>
    </div >
  )
}

export default Documents