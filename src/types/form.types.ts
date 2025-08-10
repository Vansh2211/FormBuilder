export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';

export type ValidationType = 'required' | 'minLength' | 'maxLength' | 'email' | 'password';

export interface ValidationRule {
    type: ValidationType;
    value?: number;
    message: string;
}

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    defaultValue: string | string[];
    validations: ValidationRule[];
    options?: string[];
    isDerived?: boolean;
    derivedFormula?: string;
    derivedFrom?: string[];
}

export interface FormSchema {
    id: string;
    name: string;
    fields: FormField[];
    createdAt: string;
}

export interface FormData {
    [fieldId: string]: string | string[] | number;
}

export interface FormErrors {
    [fieldId: string]: string;
}

export type PageType = 'create' | 'preview' | 'myforms';

export interface AppState {
    currentForm: FormSchema;
    savedForms: FormSchema[];
    currentPage: PageType;
    formData: FormData;
    formErrors: FormErrors;
}