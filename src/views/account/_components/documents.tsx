import HeadTitle from "@/components/head-title"
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form"
import { useRef } from "react"
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import useDocumentsStore from "./documents-store";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

function Documents() {
  const form = useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { documents, setDocuments, removeDocument } = useDocumentsStore();

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
      e.target.value = "";
      return;
    }

    // Clear any previous errors
    form.clearErrors('documents');
    setDocuments([...documents, ...fileArray]);
    onChange(fileArray);
    e.target.value = "";
  };

  const handleRemoveFile = (index: number, onChange: (value: File[] | null) => void) => {
    const updatedFiles = documents.filter((_, i) => i !== index);
    removeDocument(index);
    if (updatedFiles.length === 0) {
      form.clearErrors('documents');
      onChange(null);
      return;
    }
    onChange(updatedFiles);
  };

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
                (documents && documents.length > 0) && "justify-between items-start gap-2"
              )}>
                {documents && documents.length > 0 && (
                  <div className="grid grid-cols-3 gap-1">
                    {documents.map((file, index) => {
                      return (

                        <div
                          key={index}
                          className="bg-theme-green-100 p-2.5 w-fit flex justify-start items-center gap-1 rounded-lg h-11"
                        >
                          <span className="max-w-28 truncate">{file.name}</span>
                          <span className="text-xs pl-0.5">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>

                          <Button
                            variant={'ghost'}
                            size={"icon-sm"}
                            type="button"
                            onClick={() => handleRemoveFile(index, field.onChange)}
                            className="p-0.5 hover:text-red-600 transition-colors cursor-pointer size-5"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>


                      )
                    })}
                  </div>
                )}
                <label htmlFor="dropzone-file" className="cursor-pointer">
                  <Button
                    className="z-0 cursor-pointer h-11 hover:shadow"
                    type="button"
                    variant={'secondary'}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {(documents && documents.length > 0) ? 'Upload more' : `Upload documents`}
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