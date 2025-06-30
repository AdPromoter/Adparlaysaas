import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const FormPreview: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (formId) {
      const forms = JSON.parse(localStorage.getItem('forms') || '[]');
      const foundForm = forms.find((f: any) => f.id === formId);
      setForm(foundForm);
    }
    setLoading(false);
  }, [formId]);

  if (loading) return <div>Loading...</div>;
  if (!form) return <div>Form not found</div>;

  return (
    <div className="p-8">
      <h1>{form.title}</h1>
      <p>Form ID: {formId}</p>
    </div>
  );
};

export default FormPreview;
