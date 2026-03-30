"use client";

import { useFormStatus } from "react-dom";
import { addPlant } from "./actions";
import { useState, useRef } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="submit-btn" disabled={pending}>
      {pending ? "Adding..." : "Add Plant to Catalog"}
    </button>
  );
}

export default function AddPlantForm() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const clientAction = async (formData: FormData) => {
    setMessage(null);
    const res = await addPlant(formData);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else if (res.success) {
      setMessage({ type: "success", text: res.success });
      formRef.current?.reset();
    }
  };

  return (
    <div id="add-plant" className="form-container">
      <div className="container">
        <h2 className="section-title">Enrich Our Catalog</h2>
        <form ref={formRef} action={clientAction} className="add-plant-form">
          {message && (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1.5rem",
                borderRadius: "12px",
                backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
                color: message.type === "success" ? "#155724" : "#721c24",
                border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
              }}
            >
              {message.text}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="name">Plant Name</label>
            <input type="text" id="name" name="name" required placeholder="e.g., Fiddle Leaf Fig" />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" required>
              <option value="Indoor">Indoor Plants</option>
              <option value="Outdoor">Outdoor Plants</option>
              <option value="Succulents">Succulents</option>
              <option value="Tools">Tools & Accessories</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="price">Price ($)</label>
            <input type="number" step="0.01" id="price" name="price" required placeholder="29.99" />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} placeholder="A beautiful plant for your living room..."></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (Optional)</label>
            <input type="url" id="imageUrl" name="imageUrl" placeholder="https://unsplash.com/photos/..." />
          </div>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
