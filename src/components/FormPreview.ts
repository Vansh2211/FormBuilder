import { FormField, FormSchema, FormData, FormErrors } from '../types/form.types';
import { ValidationManager } from '../utils/validation';

export class FormPreview {
    private form: FormSchema;
    private formData: FormData;
    private formErrors: FormErrors;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.form = { id: '', name: '', fields: [], createdAt: '' };
        this.formData = {};
        this.formErrors = {};
    }

    public loadForm(form: FormSchema): void {
        this.form = { ...form };
        this.initializeFormData();
        this.renderPreview();
    }

    private initializeFormData(): void {
        this.formData = {};
        this.formErrors = {};
        
        this.form.fields.forEach(field => {
            this.formData[field.id] = field.type === 'checkbox' ? [] : '';
        });
    }

    public renderPreview(): void {
        if (this.form.fields.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <p>No form to preview. Add some fields first.</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <h3>${this.form.name || 'Form Preview'}</h3>
            <form id="preview-form">
                ${this.form.fields.map(field => this.renderField(field)).join('')}
                <div style="margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">Submit Form</button>
                    <button type="button" class="btn btn-secondary clear-form" style="margin-left: 10px;">
                        Clear Form
                    </button>
                </div>
            </form>
        `;

        this.attachEventListeners();
        this.updateDerivedFields();
    }

    private renderField(field: FormField): string {
        const value = this.formData[field.id] || (field.type === 'checkbox' ? [] : '');
        const error = this.formErrors[field.id];
        const isReadOnly = field.isDerived;

        let fieldHTML = '';

        switch (field.type) {
            case 'text':
            case 'number':
                fieldHTML = `
                    <input type="${field.type}" class="form-control ${error ? 'error' : ''}" 
                           value="${value}" ${isReadOnly ? 'readonly' : ''}
                           data-field-id="${field.id}">
                `;
                break;

            case 'textarea':
                fieldHTML = `
                    <textarea class="form-control ${error ? 'error' : ''}" rows="4" 
                              ${isReadOnly ? 'readonly' : ''}
                              data-field-id="${field.id}">${value}</textarea>
                `;
                break;

            case 'date':
                fieldHTML = `
                    <input type="date" class="form-control ${error ? 'error' : ''}" 
                           value="${value}" ${isReadOnly ? 'readonly' : ''}
                           data-field-id="${field.id}">
                `;
                break;

            case 'select':
                fieldHTML = `
                    <select class="form-control ${error ? 'error' : ''}" 
                            ${isReadOnly ? 'disabled' : ''}
                            data-field-id="${field.id}">
                        <option value="">Choose an option</option>
                        ${(field.options || []).map(option => `
                            <option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>
                        `).join('')}
                    </select>
                `;
                break;

            case 'radio':
                fieldHTML = `
                    <div class="radio-group">
                        ${(field.options || []).map(option => `
                            <div class="radio-item">
                                <input type="radio" name="${field.id}" value="${option}" 
                                       ${value === option ? 'checked' : ''}
                                       ${isReadOnly ? 'disabled' : ''}
                                       data-field-id="${field.id}">
                                <label>${option}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;

            case 'checkbox':
                fieldHTML = `
                    <div class="checkbox-group">
                        ${(field.options || []).map(option => `
                            <div class="checkbox-item">
                                <input type="checkbox" value="${option}" 
                                       ${Array.isArray(value) && value.includes(option) ? 'checked' : ''}
                                       ${isReadOnly ? 'disabled' : ''}
                                       data-field-id="${field.id}"
                                       data-option="${option}">
                                <label>${option}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
        }

        return `
            <div class="form-group">
                <label class="form-label">
                    ${field.label}
                    ${field.required ? ' *' : ''}
                    ${field.isDerived ? ' (Derived)' : ''}
                </label>
                ${fieldHTML}
                ${error ? `<div class="error-message">${error}</div>` : ''}
            </div>
        `;
    }

    private attachEventListeners(): void {
        const form = document.getElementById('preview-form');
        if (!form) return;

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Clear form button
        const clearBtn = form.querySelector('.clear-form');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }

        // Input field changes
    form.querySelectorAll('input[data-field-id], select[data-field-id], textarea[data-field-id]')
    .forEach(element => {
        const fieldId = element.getAttribute('data-field-id')!;

        if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            element.addEventListener('change', (e) => {
                const option = (e.target as HTMLInputElement).getAttribute('data-option')!;
                const checked = (e.target as HTMLInputElement).checked;
                this.handleCheckboxChange(fieldId, option, checked);
            });
        } else {
            element.addEventListener('change', (e) => {
                const value = (e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
                this.handleFieldChange(fieldId, value);
            });
        }
    });
}

    private handleFieldChange(fieldId: string, value: string): void {
        this.formData[fieldId] = value;
        this.validateField(fieldId, value);
        this.updateDerivedFields();
    }

    private handleCheckboxChange(fieldId: string, option: string, checked: boolean): void {
        if (!Array.isArray(this.formData[fieldId])) {
            this.formData[fieldId] = [];
        }

        const currentValues = this.formData[fieldId] as string[];

        if (checked) {
            if (!currentValues.includes(option)) {
                currentValues.push(option);
            }
        } else {
            this.formData[fieldId] = currentValues.filter(item => item !== option);
        }

        this.validateField(fieldId, this.formData[fieldId]);
        this.updateDerivedFields();
    }

    private validateField(fieldId: string, value: string | string[]): void {
        const field = this.form.fields.find(f => f.id === fieldId);
        if (field) {
            this.formErrors[fieldId] = ValidationManager.validateField(field, value);
        }
    }

    private updateDerivedFields(): void {
        this.form.fields.forEach(field => {
            if (field.isDerived && field.derivedFormula) {
                try {
                    let formula = field.derivedFormula;
                    
                    // Replace field labels with values in the formula
                    this.form.fields.forEach(f => {
                        if (f.id !== field.id) {
                            const fieldValue = this.formData[f.id] || '';
                            const numericValue = isNaN(Number(fieldValue)) ? 0 : parseFloat(String(fieldValue));
                            // Escape special regex characters in field label
                            const escapedLabel = f.label.replace(/[.*+?^${}()|[\]\\]/g, '\\### Continue with remaining files...');
                            formula = formula.replace(new RegExp(escapedLabel, 'g'), numericValue.toString());
                        }
                    });
                    
                    // Simple arithmetic evaluation (basic security - only allow numbers and operators)
                    if (/^[\d+\-*/(). ]+$/.test(formula)) {
                        const result = Function('"use strict"; return (' + formula + ')')();
                        this.formData[field.id] = result.toString();
                        
                        // Update the input field in the DOM
                        const inputElement = document.querySelector(`[data-field-id="${field.id}"]`) as HTMLInputElement;
                        if (inputElement) {
                            inputElement.value = result.toString();
                        }
                    }
                } catch (e) {
                    console.log('Formula error for field:', field.label, e);
                }
            }
        });
    }

    private handleFormSubmit(): void {
        // Validate all fields
        const errors = ValidationManager.validateForm(this.form.fields, this.formData);
        this.formErrors = errors;

        if (ValidationManager.hasErrors(errors)) {
            alert('Please fix the errors in the form before submitting.');
            this.renderPreview(); // Re-render to show errors
            return;
        }

        // Show success message with form data
        const formDataString = JSON.stringify(this.formData, null, 2);
        alert(`Form submitted successfully!\n\nForm Data:\n${formDataString}`);
    }

    private clearForm(): void {
        this.initializeFormData();
        this.renderPreview();
    }

    public getFormData(): FormData {
        return { ...this.formData };
    }

    public getFormErrors(): FormErrors {
        return { ...this.formErrors };
    }
}