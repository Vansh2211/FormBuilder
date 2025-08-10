import { FormField, FormSchema, ValidationRule, FieldType, ValidationType } from '../types/form.types';
import { DEFAULT_VALIDATION_MESSAGES, FIELD_TYPES, VALIDATION_TYPES } from '../utils/constants';
import { StorageManager } from '../utils/storage';

export class FormBuilder {
    private currentForm: FormSchema;
    private container: HTMLElement;
    private onFormChange: (form: FormSchema) => void;

    constructor(container: HTMLElement, onFormChange: (form: FormSchema) => void) {
        this.container = container;
        this.onFormChange = onFormChange;
        this.currentForm = this.createEmptyForm();
        this.initialize();
    }

    private createEmptyForm(): FormSchema {
        return {
            id: '',
            name: '',
            fields: [],
            createdAt: ''
        };
    }

    private initialize(): void {
        this.loadAutoSavedForm();
        this.renderFields();
        this.setupEventListeners();
        this.startAutoSave();
    }

    private loadAutoSavedForm(): void {
        const autoSaved = StorageManager.loadAutoSavedForm();
        if (autoSaved) {
            this.currentForm = autoSaved;
        }
    }

    private setupEventListeners(): void {
        const addFieldBtn = document.getElementById('add-field-btn');
        if (addFieldBtn) {
            addFieldBtn.addEventListener('click', () => this.addField());
        }
    }

    private startAutoSave(): void {
        setInterval(() => {
            StorageManager.autoSaveCurrentForm(this.currentForm);
        }, 30000); // Auto-save every 30 seconds
    }

    public addField(): void {
        const field: FormField = {
            id: this.generateId(),
            type: 'text',
            label: 'New Field',
            required: false,
            defaultValue: '',
            validations: [],
            options: [],
            isDerived: false,
            derivedFormula: '',
            derivedFrom: []
        };

        this.currentForm.fields.push(field);
        this.renderFields();
        this.notifyFormChange();
    }

    public deleteField(fieldId: string): void {
        this.currentForm.fields = this.currentForm.fields.filter(field => field.id !== fieldId);
        this.renderFields();
        this.notifyFormChange();
    }

    public updateField(fieldId: string, property: keyof FormField, value: any): void {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) {
            if (property === 'options' && typeof value === 'string') {
                field.options = value.split(',').map(s => s.trim()).filter(s => s);
            } else {
                (field as any)[property] = value;
            }
            this.renderFields();
            this.notifyFormChange();
        }
    }

    public addValidation(fieldId: string, type: ValidationType): void {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) {
            // Check for duplicate validations
            if (field.validations.some(v => v.type === type)) {
                alert('This validation is already added!');
                return;
            }

            const validation: ValidationRule = {
                type,
                message: DEFAULT_VALIDATION_MESSAGES[type],
                ...(type === 'minLength' || type === 'maxLength' ? { value: 1 } : {})
            };

            field.validations.push(validation);
            this.renderFields();
            this.notifyFormChange();
        }
    }

    public updateValidation(fieldId: string, index: number, property: keyof ValidationRule, value: any): void {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field && field.validations[index]) {
            if (property === 'value') {
                field.validations[index].value = parseInt(value) || 0;
            } else {
                (field.validations[index] as any)[property] = value;
            }
            this.notifyFormChange();
        }
    }

    public removeValidation(fieldId: string, index: number): void {
        const field = this.currentForm.fields.find(f => f.id === fieldId);
        if (field) {
            field.validations.splice(index, 1);
            this.renderFields();
            this.notifyFormChange();
        }
    }

    public toggleFieldConfig(fieldId: string): void {
        const config = document.getElementById(`config-${fieldId}`);
        if (config) {
            config.classList.toggle('show');
        }
    }

    public getCurrentForm(): FormSchema {
        return { ...this.currentForm };
    }

    public loadForm(form: FormSchema): void {
        this.currentForm = { ...form };
        this.renderFields();
        this.notifyFormChange();
    }

    public clearForm(): void {
        this.currentForm = this.createEmptyForm();
        this.renderFields();
        this.notifyFormChange();
    }

    private renderFields(): void {
        const fieldsContainer = document.getElementById('fields-container');
        if (!fieldsContainer) return;

        if (this.currentForm.fields.length === 0) {
            fieldsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No fields added yet. Click "Add Field" to start building your form.</p>
                </div>
            `;
            return;
        }

        fieldsContainer.innerHTML = this.currentForm.fields.map(field => this.renderFieldEditor(field)).join('');
        this.attachFieldEventListeners();
    }

    private renderFieldEditor(field: FormField): string {
        return `
            <div class="field-item">
                <div class="field-header">
                    <div>
                        <span class="field-title">${field.label}</span>
                        <span class="field-type">${field.type}</span>
                        ${field.isDerived ? '<span class="field-type" style="background: #f39c12;">Derived</span>' : ''}
                    </div>
                    <div class="field-actions">
                        <button class="btn btn-secondary edit-field" data-field-id="${field.id}">Edit</button>
                        <button class="btn btn-danger delete-field" data-field-id="${field.id}">Delete</button>
                    </div>
                </div>
                
                <div id="config-${field.id}" class="field-config">
                    ${this.renderFieldConfig(field)}
                </div>
            </div>
        `;
    }

    private renderFieldConfig(field: FormField): string {
        return `
            <div class="config-row">
                <div class="form-group">
                    <label class="form-label">Field Label</label>
                    <input type="text" class="form-control field-label-input" 
                           data-field-id="${field.id}" value="${field.label}">
                </div>
                <div class="form-group">
                    <label class="form-label">Field Type</label>
                    <select class="form-control field-type-select" data-field-id="${field.id}">
                        ${FIELD_TYPES.map(type => `
                            <option value="${type.value}" ${field.type === type.value ? 'selected' : ''}>
                                ${type.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <div class="config-row">
                <div class="form-group">
                    <div class="switch-container">
                        <div class="switch ${field.required ? 'active' : ''} required-toggle" 
                             data-field-id="${field.id}">
                            <div class="switch-thumb"></div>
                        </div>
                        <label class="form-label">Required Field</label>
                    </div>
                </div>
                <div class="form-group">
                    <div class="switch-container">
                        <div class="switch ${field.isDerived ? 'active' : ''} derived-toggle" 
                             data-field-id="${field.id}">
                            <div class="switch-thumb"></div>
                        </div>
                        <label class="form-label">Derived Field</label>
                    </div>
                </div>
            </div>

            ${this.renderOptionsConfig(field)}
            ${this.renderDerivedConfig(field)}
            ${this.renderValidationConfig(field)}
        `;
    }

    private renderOptionsConfig(field: FormField): string {
        if (!['select', 'radio', 'checkbox'].includes(field.type)) {
            return '';
        }

        return `
            <div class="form-group">
                <label class="form-label">Options (comma-separated)</label>
                <input type="text" class="form-control options-input" 
                       data-field-id="${field.id}" 
                       value="${field.options?.join(', ') || ''}" 
                       placeholder="Option 1, Option 2, Option 3">
            </div>
        `;
    }

    private renderDerivedConfig(field: FormField): string {
        if (!field.isDerived) {
            return '';
        }

        return `
            <div class="form-group">
                <label class="form-label">Derived Formula</label>
                <input type="text" class="form-control formula-input" 
                       data-field-id="${field.id}" 
                       value="${field.derivedFormula || ''}" 
                       placeholder="e.g., field1 + field2">
                <small style="color: #7f8c8d;">Use field labels in your formula (basic arithmetic only)</small>
            </div>
        `;
    }

    private renderValidationConfig(field: FormField): string {
        return `
            <div class="form-group">
                <label class="form-label">Add Validations</label>
                <div class="validation-buttons">
                    ${VALIDATION_TYPES.map(type => `
                        <button class="btn btn-secondary add-validation" 
                                data-field-id="${field.id}" 
                                data-validation-type="${type}">${type}</button>
                    `).join('')}
                </div>
                <div class="validation-list">
                    ${field.validations.map((validation, index) => this.renderValidationItem(field.id, validation, index)).join('')}
                </div>
            </div>
        `;
    }

    private renderValidationItem(fieldId: string, validation: ValidationRule, index: number): string {
        return `
            <div class="validation-item">
                <span class="validation-type">${validation.type}</span>
                ${(validation.type === 'minLength' || validation.type === 'maxLength') ? `
                    <input type="number" class="form-control validation-value" 
                           data-field-id="${fieldId}" 
                           data-validation-index="${index}"
                           value="${validation.value || ''}" style="width: 80px;">
                ` : ''}
                <input type="text" class="form-control validation-message" 
                       data-field-id="${fieldId}" 
                       data-validation-index="${index}"
                       value="${validation.message}" 
                       placeholder="Error message" style="flex: 1;">
                <button class="btn btn-danger remove-validation" 
                        data-field-id="${fieldId}" 
                        data-validation-index="${index}">Remove</button>
            </div>
        `;
    }

    private attachFieldEventListeners(): void {
        // Edit field buttons
        document.querySelectorAll('.edit-field').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldId = (e.target as HTMLElement).getAttribute('data-field-id')!;
                this.toggleFieldConfig(fieldId);
            });
        });

        // Delete field buttons
        document.querySelectorAll('.delete-field').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldId = (e.target as HTMLElement).getAttribute('data-field-id')!;
                this.deleteField(fieldId);
            });
        });

        // Field label inputs
        document.querySelectorAll('.field-label-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldId = (e.target as HTMLInputElement).getAttribute('data-field-id')!;
                this.updateField(fieldId, 'label', (e.target as HTMLInputElement).value);
            });
        });

        // Field type selects
        document.querySelectorAll('.field-type-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const fieldId = (e.target as HTMLSelectElement).getAttribute('data-field-id')!;
                this.updateField(fieldId, 'type', (e.target as HTMLSelectElement).value as FieldType);
            });
        });

        // Required toggles
        document.querySelectorAll('.required-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const fieldId = (e.currentTarget as HTMLElement).getAttribute('data-field-id')!;
                const isActive = (e.currentTarget as HTMLElement).classList.contains('active');
                (e.currentTarget as HTMLElement).classList.toggle('active');
                this.updateField(fieldId, 'required', !isActive);
            });
        });

        // Derived toggles
        document.querySelectorAll('.derived-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const fieldId = (e.currentTarget as HTMLElement).getAttribute('data-field-id')!;
                const isActive = (e.currentTarget as HTMLElement).classList.contains('active');
                (e.currentTarget as HTMLElement).classList.toggle('active');
                this.updateField(fieldId, 'isDerived', !isActive);
            });
        });

        // Options inputs
        document.querySelectorAll('.options-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldId = (e.target as HTMLInputElement).getAttribute('data-field-id')!;
                this.updateField(fieldId, 'options', (e.target as HTMLInputElement).value);
            });
        });

        // Formula inputs
        document.querySelectorAll('.formula-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldId = (e.target as HTMLInputElement).getAttribute('data-field-id')!;
                this.updateField(fieldId, 'derivedFormula', (e.target as HTMLInputElement).value);
            });
        });

        // Add validation buttons
        document.querySelectorAll('.add-validation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldId = (e.target as HTMLElement).getAttribute('data-field-id')!;
                const validationType = (e.target as HTMLElement).getAttribute('data-validation-type') as ValidationType;
                this.addValidation(fieldId, validationType);
            });
        });

        // Validation value inputs
        document.querySelectorAll('.validation-value').forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldId = (e.target as HTMLInputElement).getAttribute('data-field-id')!;
                const index = parseInt((e.target as HTMLInputElement).getAttribute('data-validation-index')!);
                this.updateValidation(fieldId, index, 'value', (e.target as HTMLInputElement).value);
            });
        });

        // Validation message inputs
        document.querySelectorAll('.validation-message').forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldId = (e.target as HTMLInputElement).getAttribute('data-field-id')!;
                const index = parseInt((e.target as HTMLInputElement).getAttribute('data-validation-index')!);
                this.updateValidation(fieldId, index, 'message', (e.target as HTMLInputElement).value);
            });
        });

        // Remove validation buttons
        document.querySelectorAll('.remove-validation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fieldId = (e.target as HTMLElement).getAttribute('data-field-id')!;
                const index = parseInt((e.target as HTMLElement).getAttribute('data-validation-index')!);
                this.removeValidation(fieldId, index);
            });
        });
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    private notifyFormChange(): void {
        this.onFormChange(this.currentForm);
    }

}