"use client"

import * as React from "react"
import { motion } from "motion/react"
import type { ConfigField, ConfigFormValues } from "@/shared/types"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Checkbox } from "@/shared/ui/checkbox"
import { staggerFadeIn } from "@/shared/lib/animations"
import { cn } from "@/shared/lib/utils"

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
          <div className="relative group">
            <Input
              type="text"
              value={(fieldValue as string) || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="bg-card/40 backdrop-blur-md border-border/60 focus-visible:border-primary/50 focus-visible:shadow-[0_0_16px_var(--primary-glow)] transition-all duration-300"
            />
          </div>
        )

      case "textarea":
        return (
          <div className="relative group">
            <textarea
              value={(fieldValue as string) || ""}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                "font-body file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-card/40 backdrop-blur-md border-border/60 min-h-[80px] w-full min-w-0 rounded-xl border-[1.5px] px-3 py-2 text-base shadow-xs transition-all duration-300 outline-none resize-y disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-primary/50 focus-visible:ring-[4px] focus-visible:ring-primary-subtle focus-visible:shadow-[0_0_16px_var(--primary-glow)]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
              )}
            />
          </div>
        )

      case "number":
        return (
          <div className="relative group">
            <Input
              type="number"
              value={(fieldValue as number) || ""}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              className="bg-card/40 backdrop-blur-md border-border/60 focus-visible:border-primary/50 focus-visible:shadow-[0_0_16px_var(--primary-glow)] transition-all duration-300"
            />
          </div>
        )

      case "select":
        return (
          <div className="relative group">
            <Select
              value={(fieldValue as string) || ""}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              <SelectTrigger className="w-full bg-card/40 backdrop-blur-md border-border/60 focus-visible:border-primary/50 focus-visible:shadow-[0_0_16px_var(--primary-glow)] transition-all duration-300">
                <SelectValue placeholder={field.placeholder || "Выберите вариант"} />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/60">
                {field.options?.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="focus:bg-primary/10 transition-colors duration-200"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "multiselect":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const isChecked = ((fieldValue as string[]) || []).includes(option)
              return (
                <div
                  key={option}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                    "bg-card/40 backdrop-blur-md border-border/60",
                    "hover:bg-card/60 hover:border-primary/30 cursor-pointer",
                    isChecked && "bg-primary/5 border-primary/30 shadow-[0_0_12px_var(--primary-glow)]"
                  )}
                >
                  <Checkbox
                    id={`${field.name}-${option}`}
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(field.name, option, checked === true)
                    }
                    className="border-border/60 data-[state=checked]:bg-[image:var(--gradient-main)] data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`${field.name}-${option}`}
                    className="cursor-pointer font-body flex-1"
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
          <Label htmlFor={field.name} className="font-heading font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {renderField(field)}
        </motion.div>
      ))}
    </motion.div>
  )
}
