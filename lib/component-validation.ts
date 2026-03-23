import type {
    ComponentField,
    ComponentSchema,
    ValidationRule,
  } from "@/lib/component-schema";
  
  export type ValidationError = {
    fieldId: string;
    message: string;
  };
  
  export type ValidationResult = {
    valid: boolean;
    errors: ValidationError[];
  };
  
  function isEmptyValue(value: unknown) {
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  }
  
  function validateRule(
    fieldId: string,
    value: unknown,
    rule: ValidationRule
  ): ValidationError | null {
    if (rule.type === "required") {
      if (isEmptyValue(value)) {
        return {
          fieldId,
          message: rule.message || "This field is required.",
        };
      }
    }
  
    if (rule.type === "minLength") {
      if (typeof value === "string" && value.length < rule.value) {
        return {
          fieldId,
          message:
            rule.message || `Must be at least ${rule.value} characters long.`,
        };
      }
    }
  
    if (rule.type === "maxLength") {
      if (typeof value === "string" && value.length > rule.value) {
        return {
          fieldId,
          message:
            rule.message || `Must be at most ${rule.value} characters long.`,
        };
      }
    }
  
    if (rule.type === "minItems") {
      if (Array.isArray(value) && value.length < rule.value) {
        return {
          fieldId,
          message: rule.message || `Must contain at least ${rule.value} items.`,
        };
      }
    }
  
    if (rule.type === "maxItems") {
      if (Array.isArray(value) && value.length > rule.value) {
        return {
          fieldId,
          message: rule.message || `Must contain at most ${rule.value} items.`,
        };
      }
    }
  
    if (rule.type === "regex") {
      if (typeof value === "string") {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          return {
            fieldId,
            message: rule.message || "This field has an invalid format.",
          };
        }
      }
    }
  
    if (rule.type === "allowedValues") {
      if (!isEmptyValue(value) && !rule.value.includes(String(value))) {
        return {
          fieldId,
          message: rule.message || "This value is not allowed.",
        };
      }
    }
  
    return null;
  }
  
  function validateSimpleField(
    field: ComponentField,
    value: unknown
  ): ValidationError[] {
    const errors: ValidationError[] = [];
  
    for (const rule of field.validation || []) {
      const error = validateRule(field.id, value, rule);
      if (error) errors.push(error);
    }
  
    return errors;
  }
  
  function validateRepeaterField(
    field: ComponentField,
    value: unknown
  ): ValidationError[] {
    const errors: ValidationError[] = [];
  
    for (const rule of field.validation || []) {
      const error = validateRule(field.id, value, rule);
      if (error) errors.push(error);
    }
  
    if (!Array.isArray(value)) {
      return errors;
    }
  
    if (!field.children || field.children.length === 0) {
      return errors;
    }
  
    value.forEach((item, itemIndex) => {
      if (!item || typeof item !== "object") {
        errors.push({
          fieldId: `${field.id}[${itemIndex}]`,
          message: "Repeater item must be an object.",
        });
        return;
      }
  
      field.children?.forEach((child) => {
        const childValue = (item as Record<string, unknown>)[child.id];
  
        for (const rule of child.validation || []) {
          const error = validateRule(
            `${field.id}[${itemIndex}].${child.id}`,
            childValue,
            rule
          );
  
          if (error) errors.push(error);
        }
      });
    });
  
    return errors;
  }
  
  export function validateComponentData(
    schema: ComponentSchema,
    data: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];
  
    schema.fields.forEach((field) => {
      const value = data[field.id];
  
      if (field.type === "repeater") {
        errors.push(...validateRepeaterField(field, value));
      } else {
        errors.push(...validateSimpleField(field, value));
      }
    });
  
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  export function validateFieldValue(
    field: ComponentField,
    value: unknown
  ): ValidationError[] {
    if (field.type === "repeater") {
      return validateRepeaterField(field, value);
    }
  
    return validateSimpleField(field, value);
  }
  
  export function getErrorsForField(
    errors: ValidationError[],
    fieldId: string
  ): ValidationError[] {
    return errors.filter(
      (error) => error.fieldId === fieldId || error.fieldId.startsWith(`${fieldId}.`) || error.fieldId.startsWith(`${fieldId}[`)
    );
  }
  
  export function hasErrorsForField(
    errors: ValidationError[],
    fieldId: string
  ): boolean {
    return getErrorsForField(errors, fieldId).length > 0;
  }