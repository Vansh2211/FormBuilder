import { ValidationType } from '../types/form.types';

export const STORAGE_KEYS = {
    SAVED_FORMS: 'formBuilder_savedForms',
    CURRENT_FORM: 'formBuilder_currentForm'
} as const;

export const DEFAULT_VALIDATION_MESSAGES: Record<ValidationType, string> = {
    required: 'This field is required',
    minLength: 'Minimum length not met',
    maxLength: 'Maximum length exceeded',
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters with a number'
};

export const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date' }
] as const;

export const VALIDATION_TYPES: ValidationType[] = [
    'required', 'minLength', 'maxLength', 'email', 'password'
];