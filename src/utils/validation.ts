import { ValidationRule, FormField, FormData } from '../types/form.types';

export class ValidationManager {
    static validateField(field: FormField, value: string | string[]): string {
        for (const validation of field.validations) {
            const error = this.validateRule(validation, value);
            if (error) {
                return error;
            }
        }
        return '';
    }

    private static validateRule(rule: ValidationRule, value: string | string[]): string {
        switch (rule.type) {
            case 'required':
                return this.validateRequired(rule, value);
            case 'minLength':
                return this.validateMinLength(rule, value);
            case 'maxLength':
                return this.validateMaxLength(rule, value);
            case 'email':
                return this.validateEmail(rule, value);
            case 'password':
                return this.validatePassword(rule, value);
            default:
                return '';
        }
    }

    private static validateRequired(rule: ValidationRule, value: string | string[]): string {
        if (!value || (Array.isArray(value) && value.length === 0)) {
            return rule.message;
        }
        return '';
    }

    private static validateMinLength(rule: ValidationRule, value: string | string[]): string {
        if (typeof value === 'string' && value.length < (rule.value || 0)) {
            return rule.message;
        }
        return '';
    }

    private static validateMaxLength(rule: ValidationRule, value: string | string[]): string {
        if (typeof value === 'string' && value.length > (rule.value || 0)) {
            return rule.message;
        }
        return '';
    }

    private static validateEmail(rule: ValidationRule, value: string | string[]): string {
        if (typeof value === 'string' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return rule.message;
        }
        return '';
    }

    private static validatePassword(rule: ValidationRule, value: string | string[]): string {
        if (typeof value === 'string' && value && (value.length < 8 || !/\d/.test(value))) {
            return rule.message;
        }
        return '';
    }

    static validateForm(fields: FormField[], formData: FormData): { [fieldId: string]: string } {
        const errors: { [fieldId: string]: string } = {};
        
        fields.forEach(field => {
            const value = formData[field.id];
            const error = this.validateField(field, value as string | string[]);
            if (error) {
                errors[field.id] = error;
            }
        });

        return errors;
    }

    static hasErrors(errors: { [fieldId: string]: string }): boolean {
        return Object.values(errors).some(error => error !== '');
    }
}