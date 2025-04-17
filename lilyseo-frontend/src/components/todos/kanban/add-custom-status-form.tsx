"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

// Define form schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(30, { message: "Name must not exceed 30 characters." }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { 
    message: "Please enter a valid hex color code (e.g., #FF5500)." 
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Pre-defined color options
const colorOptions = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#6B7280", // Gray
];

interface AddCustomStatusFormProps {
  onSubmit: (name: string, color: string) => void;
}

export function AddCustomStatusForm({ onSubmit }: AddCustomStatusFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: colorOptions[0],
    },
  });

  const handleSubmit = (values: FormValues) => {
    try {
      onSubmit(values.name, values.color);
      form.reset();
    } catch (error) {
      toast.error("Failed to add custom column. Please try again.");
      console.error("Error adding custom column:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Column Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., In Review" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Column Color</FormLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        field.value === color ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => form.setValue("color", color)}
                    >
                      {field.value === color && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
                <FormControl>
                  <div className="flex gap-2">
                    <Input placeholder="#3B82F6" {...field} />
                    <div
                      className="w-10 h-10 rounded-md border"
                      style={{ backgroundColor: field.value }}
                    ></div>
                  </div>
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => form.reset()}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit">
            <Check className="h-4 w-4 mr-2" />
            Add Column
          </Button>
        </div>
      </form>
    </Form>
  );
} 