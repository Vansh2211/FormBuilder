import { FormSchema } from '../types/form.types';
import { STORAGE_KEYS } from './constants';

export class StorageManager {
    static saveForm(form: FormSchema): void {
        try {
            const savedForms = this.getSavedForms();
            savedForms.push(form);
            localStorage.setItem(STORAGE_KEYS.SAVED_FORMS, JSON.stringify(savedForms));
        } catch (error) {
            console.error('Error saving form:', error);
            throw new Error('Failed to save form');
        }
    }

    static getSavedForms(): FormSchema[] {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SAVED_FORMS);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved forms:', error);
            return [];
        }
    }

    static updateSavedForms(forms: FormSchema[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.SAVED_FORMS, JSON.stringify(forms));
        } catch (error) {
            console.error('Error updating saved forms:', error);
            throw new Error('Failed to update forms');
        }
    }

    static deleteForm(formId: string): void {
        try {
            const savedForms = this.getSavedForms();
            const updatedForms = savedForms.filter(form => form.id !== formId);
            this.updateSavedForms(updatedForms);
        } catch (error) {
            console.error('Error deleting form:', error);
            throw new Error('Failed to delete form');
        }
    }

    static getFormById(formId: string): FormSchema | null {
        const savedForms = this.getSavedForms();
        return savedForms.find(form => form.id === formId) || null;
    }

    static autoSaveCurrentForm(form: FormSchema): void {
        try {
            if (form.fields.length > 0) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_FORM, JSON.stringify(form));
            }
        } catch (error) {
            console.error('Error auto-saving current form:', error);
        }
    }

    static loadAutoSavedForm(): FormSchema | null {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_FORM);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Error loading auto-saved form:', error);
            return null;
        }
    }

    static clearAutoSave(): void {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_FORM);
    }
}