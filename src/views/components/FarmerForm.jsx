import { useEffect, useState } from "react";

const empty = {
  rsbsa_number: "",
  name: "",
  crops: "",
  status: "active",
  address: "",
  phone: "",
  email: "",
  password: "",
  current_password: "",
  new_password: ""
};

export default function FarmerForm({
  farmer,
  onSubmit,
  onCancel,
  submitting,
  selfEdit = false
}) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(farmer ? { ...empty, ...farmer } : empty);
  }, [farmer]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="farmer-form">
      <div className="form-grid">
        <label>
          RSBSA Number
          <input value={form.rsbsa_number} onChange={(e) => update("rsbsa_number", e.target.value)} required />
        </label>

        <label>
          Full Name
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </label>

        <label>
          Crops
          <input value={form.crops || ""} onChange={(e) => update("crops", e.target.value)} placeholder="Rice, Corn" />
        </label>

        <label>
          Status
          <select value={form.status} onChange={(e) => update("status", e.target.value)} disabled={selfEdit}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label>
          Phone
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
        </label>

        <label>
          Email
          <input type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
        </label>

        <label className="full-span">
          Address
          <input value={form.address || ""} onChange={(e) => update("address", e.target.value)} />
        </label>

        {!selfEdit && (
          <label className="full-span">
            Password
            <span className="field-hint">Leave blank to use the database default for a new farmer, or keep the current password when updating.</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder={farmer ? "Leave blank to keep current password" : "Default: terrapass"}
            />
          </label>
        )}

        {selfEdit && (
          <>
            <label>
              Current Password
              <input
                type="password"
                value={form.current_password}
                onChange={(e) => update("current_password", e.target.value)}
                required
                placeholder="Verify your current password"
              />
            </label>

            <label>
              New Password
              <span className="field-hint">Optional</span>
              <input
                type="password"
                value={form.new_password}
                onChange={(e) => update("new_password", e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </label>
          </>
        )}
      </div>

      <div className="modal-footer">
        <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button primary" disabled={submitting}>
          {submitting ? "Saving..." : selfEdit ? "Save My Profile" : farmer ? "Save Changes" : "Create Farmer"}
        </button>
      </div>
    </form>
  );
}
