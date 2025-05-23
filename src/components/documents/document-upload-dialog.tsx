
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentUpload } from "@/hooks/use-document-upload";
import { DocumentType } from "@/types/clients";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum([
    "RUT",
    "Cámara de Comercio",
    "NDA",
    "Contrato",
    "Factura",
    "Otro"
  ] as const),
  file: z.instanceof(File, { message: "El archivo es requerido" })
});

interface DocumentUploadDialogProps {
  children: React.ReactNode;
  entityType: "client" | "project";
  entityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DocumentUploadDialog({
  children,
  entityType,
  entityId,
  open,
  onOpenChange,
  onSuccess
}: DocumentUploadDialogProps) {
  const { isUploading, uploadDocument } = useDocumentUpload({ entityType, entityId });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Otro" as DocumentType
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.file) {
      toast.error("Se requiere un archivo");
      return;
    }
    
    if (values.file.size === 0) {
      toast.error("El archivo está vacío");
      return;
    }
    
    try {
      console.log("Uploading document:", values);
      const result = await uploadDocument(values.file, values.type, values.name);
      
      if (result) {
        console.log("Document uploaded successfully:", result);
        form.reset();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        console.error("Upload returned null result");
        toast.error("Error al subir el documento, por favor intente nuevamente");
      }
    } catch (error) {
      console.error("Error in document upload:", error);
      toast.error("Error al subir el documento");
    }
  };

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Documento</DialogTitle>
          <DialogDescription>
            Sube un nuevo documento para {entityType === "client" ? "el cliente" : "el proyecto"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. RUT 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RUT">RUT</SelectItem>
                      <SelectItem value="Cámara de Comercio">Cámara de Comercio</SelectItem>
                      <SelectItem value="NDA">NDA</SelectItem>
                      <SelectItem value="Contrato">Contrato</SelectItem>
                      <SelectItem value="Factura">Factura</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Archivo</FormLabel>
                  <FormControl>
                    <FileUpload
                      onFileSelect={(file) => field.onChange(file)}
                      acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      maxFileSizeMB={10}
                      selectedFile={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Subiendo..." : "Subir"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
