"use client"

import * as React from "react"
import { motion } from "motion/react"
import type { ConfigField, ConfigFormValues } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { staggerFadeIn } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface ConfigFormProps {
  fields: ConfigField[]
  values: ConfigFormValues
  onChange: (values: ConfigFormValues) => void
}

export function ConfigForm({ fields, values, onChange }: ConfigFormProps) {
  const handleFieldChange = (fieldName: string, value: string | string[] | number) => {
    onChange({
      ...values,
      [fieldName]: value,
    })
  }

  const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
    const currentValues = (values[fieldName] as string[]) || []
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter((v) => v !== option)

    handleFieldChange(fieldName, newValues)
  }

  const renderField = (field: ConfigField) => {
    const fieldValue = values[field.name]

    switch (field.type) {
      case "text":
        return (
          <Input
            type="text"
            value={(fieldValue as string) || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        )

      case "textarea":
        return (
          <textarea
            value={(fieldValue as string) || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input min-h-[80px] w-full min-w-0 rounded-xl border-[1.5px] bg-transparent px-3 py-2 text-base shadow-xs transition-all duration-300 outline-none resize-y disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-primary focus-visible:ring-[4px] focus-visible:ring-primary-subtle",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
            )}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={(fieldValue as number) || ""}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
          />
        )

      case "select":
        return (
          <Select
            value={(fieldValue as string) || ""}
            onValueChange={(value) => handleFieldChange(field.name, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiselect":
        return (
          <div className="space-y-3">
            {field.options?.map((option) => {
              const isChecked = ((fieldValue as string[]) || []).includes(option)
              return (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`${field.name}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(field.name, option, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`${field.name}-${option}`}
                    className="cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )
            })}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      variants={staggerFadeIn}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {fields.map((field) => (
        <motion.div key={field.name} variants={staggerFadeIn} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {renderField(field)}
        </motion.div>
      ))}
    </motion.div>
  )
}
