import React, { useState, useEffect, useCallback } from 'react';
import './DynamicFormBuilder.css';

// Types
type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';
type ValidationType = 'required' | 'minLength' | 'maxLength' | 'email' | 'password';

interface ValidationRule {
  type: ValidationType;
  value?: number;
  message: string;
}

interface FormField {
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

interface FormSchema {
  id: string;
  name: string;
  fields: FormField[];
  createdAt: string;
}

interface FormData {
  [fieldId: string]: string | string[] | number;
}

interface FormErrors {
  [fieldId: string]: string;
}

type PageType = 'create' | 'preview' | 'myforms';

// Constants
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'date', label: 'Date' }
] as const;

const VALIDATION_TYPES: ValidationType[] = [
  'required', 'minLength', 'maxLength', 'email', 'password'
];

const DEFAULT_VALIDATION_MESSAGES: Record<ValidationType, string> = {
  required: 'This field is required',
  minLength: 'Minimum length not met',
  maxLength: 'Maximum length exceeded',
  email: 'Please enter a valid email address',
  password: 'Password must be at least 8 characters with a number'
};

// Validation utilities
const validateField = (field: FormField, value: string | string[]): string => {
  for (const validation of field.validations) {
    const error = validateRule(validation, value);
    if (error) return error;
  }
  return '';
};

const validateRule = (rule: ValidationRule, value: string | string[]): string => {
  switch (rule.type) {
    case 'required':
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return rule.message;
      }
      return '';
    case 'minLength':
      if (typeof value === 'string' && value.length < (rule.value || 0)) {
        return rule.message;
      }
      return '';
    case 'maxLength':
      if (typeof value === 'string' && value.length > (rule.value || 0)) {
        return rule.message;
      }
      return '';
    case 'email':
      if (typeof value === 'string' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return rule.message;
      }
      return '';
    case 'password':
      if (typeof value === 'string' && value && (value.length < 8 || !/\d/.test(value))) {
        return rule.message;
      }
      return '';
    default:
      return '';
  }
};

const validateForm = (fields: FormField[], formData: FormData): FormErrors => {
  const errors: FormErrors = {};
  fields.forEach(field => {
    const value = formData[field.id];
    const error = validateField(field, value as string | string[]);
    if (error) {
      errors[field.id] = error;
    }
  });
  return errors;
};

// Storage utilities (using in-memory storage)
let savedFormsStorage: FormSchema[] = [];

const StorageManager = {
  saveForm: (form: FormSchema) => {
    savedFormsStorage.push(form);
  },
  getSavedForms: (): FormSchema[] => {
    return [...savedFormsStorage];
  },
  deleteForm: (formId: string) => {
    savedFormsStorage = savedFormsStorage.filter(form => form.id !== formId);
  },
  getFormById: (formId: string): FormSchema | null => {
    return savedFormsStorage.find(form => form.id === formId) || null;
  }
};

// Component: Field Editor
const FieldEditor: React.FC<{
  field: FormField;
  onUpdate: (property: keyof FormField, value: any) => void;
  onDelete: () => void;
}> = ({ field, onUpdate, onDelete }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const addValidation = (type: ValidationType) => {
    if (field.validations.some(v => v.type === type)) {
      alert('This validation is already added!');
      return;
    }

    const validation: ValidationRule = {
      type,
      message: DEFAULT_VALIDATION_MESSAGES[type],
      ...(type === 'minLength' || type === 'maxLength' ? { value: 1 } : {})
    };

    onUpdate('validations', [...field.validations, validation]);
  };

  const updateValidation = (index: number, property: keyof ValidationRule, value: any) => {
    const newValidations = [...field.validations];
    if (property === 'value') {
      newValidations[index].value = parseInt(value) || 0;
    } else {
      (newValidations[index] as any)[property] = value;
    }
    onUpdate('validations', newValidations);
  };

  const removeValidation = (index: number) => {
    const newValidations = field.validations.filter((_, i) => i !== index);
    onUpdate('validations', newValidations);
  };

  return (
    <div className="field-item">
      <div className="field-header">
        <div>
          <span className="field-title">{field.label}</span>
          <span className="field-type">{field.type}</span>
          {field.isDerived && <span className="field-type derived">Derived</span>}
        </div>
        <div className="field-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsConfigOpen(!isConfigOpen)}
          >
            Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {isConfigOpen && (
        <div className="field-config show">
          <div className="config-row">
            <div className="form-group">
              <label className="form-label">Field Label</label>
              <input
                type="text"
                className="form-control"
                value={field.label}
                onChange={(e) => onUpdate('label', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Field Type</label>
              <select
                className="form-control"
                value={field.type}
                onChange={(e) => onUpdate('type', e.target.value as FieldType)}
              >
                {FIELD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="config-row">
            <div className="form-group">
              <div className="switch-container">
                <div 
                  className={`switch ${field.required ? 'active' : ''}`}
                  onClick={() => onUpdate('required', !field.required)}
                >
                  <div className="switch-thumb"></div>
                </div>
                <label className="form-label">Required Field</label>
              </div>
            </div>
            <div className="form-group">
              <div className="switch-container">
                <div 
                  className={`switch ${field.isDerived ? 'active' : ''}`}
                  onClick={() => onUpdate('isDerived', !field.isDerived)}
                >
                  <div className="switch-thumb"></div>
                </div>
                <label className="form-label">Derived Field</label>
              </div>
            </div>
          </div>

          {['select', 'radio', 'checkbox'].includes(field.type) && (
            <div className="form-group">
              <label className="form-label">Options (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                value={field.options?.join(', ') || ''}
                onChange={(e) => onUpdate('options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                placeholder="Option 1, Option 2, Option 3"
              />
            </div>
          )}

          {field.isDerived && (
            <div className="form-group">
              <label className="form-label">Derived Formula</label>
              <input
                type="text"
                className="form-control"
                value={field.derivedFormula || ''}
                onChange={(e) => onUpdate('derivedFormula', e.target.value)}
                placeholder="e.g., field1 + field2"
              />
              <small style={{color: '#7f8c8d'}}>Use field labels in your formula (basic arithmetic only)</small>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Add Validations</label>
            <div className="validation-buttons">
              {VALIDATION_TYPES.map(type => (
                <button
                  key={type}
                  className="btn btn-secondary"
                  onClick={() => addValidation(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="validation-list">
              {field.validations.map((validation, index) => (
                <div key={index} className="validation-item">
                  <span className="validation-type">{validation.type}</span>
                  {(validation.type === 'minLength' || validation.type === 'maxLength') && (
                    <input
                      type="number"
                      className="form-control"
                      value={validation.value || ''}
                      onChange={(e) => updateValidation(index, 'value', e.target.value)}
                      style={{width: '80px'}}
                    />
                  )}
                  <input
                    type="text"
                    className="form-control"
                    value={validation.message}
                    onChange={(e) => updateValidation(index, 'message', e.target.value)}
                    placeholder="Error message"
                    style={{flex: 1}}
                  />
                  <button
                    className="btn btn-danger"
                    onClick={() => removeValidation(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component: Form Preview Field
const PreviewField: React.FC<{
  field: FormField;
  value: string | string[];
  error?: string;
  onChange: (value: string | string[]) => void;
}> = ({ field, value, error, onChange }) => {
  const isReadOnly = field.isDerived;

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.type}
            className={`form-control ${error ? 'error' : ''}`}
            value={value as string}
            readOnly={isReadOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            className={`form-control ${error ? 'error' : ''}`}
            rows={4}
            value={value as string}
            readOnly={isReadOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className={`form-control ${error ? 'error' : ''}`}
            value={value as string}
            readOnly={isReadOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'select':
        return (
          <select
            className={`form-control ${error ? 'error' : ''}`}
            value={value as string}
            disabled={isReadOnly}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Choose an option</option>
            {(field.options || []).map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="radio-group">
            {(field.options || []).map(option => (
              <div key={option} className="radio-item">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  disabled={isReadOnly}
                  onChange={(e) => onChange(e.target.value)}
                />
                <label>{option}</label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="checkbox-group">
            {(field.options || []).map(option => (
              <div key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  disabled={isReadOnly}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter(item => item !== option));
                    }
                  }}
                />
                <label>{option}</label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {field.label}
        {field.required ? ' *' : ''}
        {field.isDerived ? ' (Derived)' : ''}
      </label>
      {renderField()}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

// Component: Save Modal
const SaveModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [formName, setFormName] = useState('');

  const handleSave = () => {
    if (!formName.trim()) {
      alert('Please enter a form name.');
      return;
    }
    onSave(formName.trim());
    setFormName('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">Save Your Form</div>
        <div className="form-group">
          <label className="form-label">Form Name</label>
          <input
            type="text"
            className="form-control"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter form name"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Form
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const DynamicFormBuilder: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('create');
  const [currentForm, setCurrentForm] = useState<FormSchema>({
    id: '',
    name: '',
    fields: [],
    createdAt: ''
  });
  const [savedForms, setSavedForms] = useState<FormSchema[]>([]);
  const [formData, setFormData] = useState<FormData>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  useEffect(() => {
    setSavedForms(StorageManager.getSavedForms());
  }, []);

  const generateId = (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const addField = () => {
    const field: FormField = {
      id: generateId(),
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

    setCurrentForm(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));
  };

  const updateField = (fieldId: string, property: keyof FormField, value: any) => {
    setCurrentForm(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, [property]: value } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setCurrentForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const initializeFormData = (form: FormSchema) => {
    const newFormData: FormData = {};
    form.fields.forEach(field => {
      newFormData[field.id] = field.type === 'checkbox' ? [] : '';
    });
    setFormData(newFormData);
    setFormErrors({});
  };

  const updateDerivedFields = useCallback((data: FormData, form: FormSchema) => {
    const newData = { ...data };
    
    form.fields.forEach(field => {
      if (field.isDerived && field.derivedFormula) {
        try {
          let formula = field.derivedFormula;
          
          form.fields.forEach(f => {
            if (f.id !== field.id) {
              const fieldValue = newData[f.id] || '';
              const numericValue = isNaN(Number(fieldValue)) ? 0 : parseFloat(String(fieldValue));
              const escapedLabel = f.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              formula = formula.replace(new RegExp(escapedLabel, 'g'), numericValue.toString());
            }
          });
          
          if (/^[\d+\-*/(). ]+$/.test(formula)) {
            const result = Function('"use strict"; return (' + formula + ')')();
            newData[field.id] = result.toString();
          }
        } catch (e) {
          console.log('Formula error for field:', field.label, e);
        }
      }
    });

    setFormData(newData);
  }, []);

  const handleFormDataChange = (fieldId: string, value: string | string[]) => {
    const newFormData = { ...formData, [fieldId]: value };
    setFormData(newFormData);
    
    // Validate field
    const field = currentForm.fields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(field, value);
      setFormErrors(prev => ({ ...prev, [fieldId]: error }));
    }

    // Update derived fields
    updateDerivedFields(newFormData, currentForm);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(currentForm.fields, formData);
    setFormErrors(errors);

    if (Object.values(errors).some(error => error !== '')) {
      alert('Please fix the errors in the form before submitting.');
      return;
    }

    const formDataString = JSON.stringify(formData, null, 2);
    alert(`Form submitted successfully!\n\nForm Data:\n${formDataString}`);
  };

  const clearForm = () => {
    initializeFormData(currentForm);
  };

  const saveForm = (name: string) => {
    if (currentForm.fields.length === 0) {
      alert('Please add some fields before saving the form.');
      return;
    }

    const newForm: FormSchema = {
      id: generateId(),
      name,
      fields: JSON.parse(JSON.stringify(currentForm.fields)),
      createdAt: new Date().toISOString()
    };

    StorageManager.saveForm(newForm);
    setSavedForms(StorageManager.getSavedForms());
    setIsSaveModalOpen(false);
    alert('Form saved successfully!');
    setCurrentPage('myforms');
  };

  const loadFormForPreview = (form: FormSchema) => {
    setCurrentForm(form);
    initializeFormData(form);
    setCurrentPage('preview');
  };

  const loadFormForEditing = (form: FormSchema) => {
    setCurrentForm(form);
    setCurrentPage('create');
  };

  const deleteForm = (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      StorageManager.deleteForm(formId);
      setSavedForms(StorageManager.getSavedForms());
      alert('Form deleted successfully!');
    }
  };

  const showPage = (page: PageType) => {
    setCurrentPage(page);
    if (page === 'preview') {
      initializeFormData(currentForm);
    }
  };

  return (
    <div className="form-builder-container">
      {/* Navigation */}
      <div className="nav">
        <h1>Dynamic Form Builder</h1>
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${currentPage === 'create' ? 'active' : ''}`}
            onClick={() => showPage('create')}
          >
            Create Form
          </button>
          <button 
            className={`nav-btn ${currentPage === 'preview' ? 'active' : ''}`}
            onClick={() => showPage('preview')}
          >
            Preview Form
          </button>
          <button 
            className={`nav-btn ${currentPage === 'myforms' ? 'active' : ''}`}
            onClick={() => showPage('myforms')}
          >
            My Forms
          </button>
        </div>
      </div>

      {/* Create Form Page */}
      {currentPage === 'create' && (
        <div className="card">
          <div className="page-header">
            <h2>Build Your Form</h2>
            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => showPage('preview')}
              >
                Preview Form
              </button>
              <button 
                className="btn btn-success"
                onClick={() => setIsSaveModalOpen(true)}
              >
                Save Form
              </button>
            </div>
          </div>
          
          <div className="add-field-section">
            <button className="btn btn-primary" onClick={addField}>
              + Add Field
            </button>
          </div>

          {currentForm.fields.length === 0 ? (
            <div className="empty-state">
              <p>No fields added yet. Click "Add Field" to start building your form.</p>
            </div>
          ) : (
            <div>
              {currentForm.fields.map(field => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(property, value) => updateField(field.id, property, value)}
                  onDelete={() => deleteField(field.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Form Page */}
      {currentPage === 'preview' && (
        <div className="card">
          <div className="page-header">
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage('create')}
            >
              ← Back to Builder
            </button>
            <h2>Form Preview</h2>
          </div>
          
          {currentForm.fields.length === 0 ? (
            <div className="empty-state">
              <p>No form to preview. Add some fields first.</p>
            </div>
          ) : (
            <div className="preview-form">
              <h3>{currentForm.name || 'Form Preview'}</h3>
              <form onSubmit={handleFormSubmit}>
                {currentForm.fields.map(field => (
                  <PreviewField
                    key={field.id}
                    field={field}
                    value={(field.type === 'checkbox' ? [] : '')}
                    error={formErrors[field.id]}
                    onChange={(value) => handleFormDataChange(field.id, value)}
                  />
                ))}
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Submit Form
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={clearForm}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
{/* My Forms Page */}
      {currentPage === 'myforms' && (
        <div className="card">
          <div className="page-header">
            <h2>My Saved Forms</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentPage('create')}
            >
              + Create New Form
            </button>
          </div>
          
          {savedForms.length === 0 ? (
            <div className="empty-state">
              <p>No saved forms yet. Create and save your first form to see it here.</p>
            </div>
          ) : (
            <div className="forms-grid">
              {savedForms.map(form => (
                <div key={form.id} className="form-card">
                  <div className="form-card-header">
                    <h3>{form.name}</h3>
                    <span className="form-date">
                      Created: {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="form-card-body">
                    <p>Fields: {form.fields.length}</p>
                    <div className="form-fields-preview">
                      {form.fields.slice(0, 3).map(field => (
                        <span key={field.id} className="field-tag">
                          {field.label}
                        </span>
                      ))}
                      {form.fields.length > 3 && (
                        <span className="field-tag more">+{form.fields.length - 3} more</span>
                      )}
                    </div>
                  </div>
                  <div className="form-card-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => loadFormForPreview(form)}
                    >
                      Preview
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => loadFormForEditing(form)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => deleteForm(form.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Modal */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={saveForm}
      />
    </div>
  );
};

export default DynamicFormBuilder;