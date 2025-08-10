import React, { useState, useEffect } from "react";
import { FormSchema, FormData, FormErrors, FormField } from "../types/form.types";
import { ValidationManager } from "../utils/validation";

interface FormPreviewProps {
  form: FormSchema;
  onSubmit?: (data: FormData) => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Initialize form data when form changes
  useEffect(() => {
    const initialData: FormData = {};
    form.fields.forEach((field) => {
      initialData[field.id] = field.type === "checkbox" ? [] : "";
    });
    setFormData(initialData);
    setFormErrors({});
  }, [form]);

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    const field = form.fields.find((f) => f.id === fieldId);
    if (field) {
      setFormErrors((prev) => ({
        ...prev,
        [fieldId]: ValidationManager.validateField(field, value),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = ValidationManager.validateForm(form.fields, formData);
    setFormErrors(errors);

    if (!ValidationManager.hasErrors(errors)) {
      onSubmit?.(formData);
      alert(`Form submitted successfully!\n\n${JSON.stringify(formData, null, 2)}`);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || (field.type === "checkbox" ? [] : "");
    const error = formErrors[field.id];

    switch (field.type) {
      case "text":
      case "number":
      case "date":
        return (
          <input
            type={field.type}
            className={`form-control ${error ? "error" : ""}`}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={field.isDerived}
          />
        );
      case "textarea":
        return (
          <textarea
            className={`form-control ${error ? "error" : ""}`}
            rows={4}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            readOnly={field.isDerived}
          />
        );
      case "select":
        return (
          <select
            className={`form-control ${error ? "error" : ""}`}
            value={value as string}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={field.isDerived}
          >
            <option value="">Choose an option</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="radio-group">
            {(field.options || []).map((option) => (
              <label key={option} className="radio-item">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={() => handleFieldChange(field.id, option)}
                  disabled={field.isDerived}
                />
                {option}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="checkbox-group">
            {(field.options || []).map((option) => (
              <label key={option} className="checkbox-item">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const newValues = Array.isArray(value) ? [...value] : [];
                    if (checked) {
                      newValues.push(option);
                    } else {
                      const index = newValues.indexOf(option);
                      if (index > -1) newValues.splice(index, 1);
                    }
                    handleFieldChange(field.id, newValues);
                  }}
                  disabled={field.isDerived}
                />
                {option}
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (form.fields.length === 0) {
    return (
      <div className="empty-state">
        <p>No form to preview. Add some fields first.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{form.name || "Form Preview"}</h2>
      <form onSubmit={handleSubmit}>
        {form.fields.map((field) => (
          <div key={field.id} className="form-group">
            <label className="form-label">
              {field.label} {field.required && "*"}{" "}
              {field.isDerived && "(Derived)"}
            </label>
            {renderField(field)}
            {formErrors[field.id] && (
              <div className="error-message">{formErrors[field.id]}</div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-primary">
            Submit Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormPreview;
