import { useEffect, useState } from "react";
import { Edit3, UserRound, MapPin, Phone, Mail, Sprout } from "lucide-react";
import { editOwnFarmerProfile, fetchFarmerProfile } from "../../controllers/farmerController";
import Header from "../components/Header";
import Modal from "../components/Modal";
import FarmerForm from "../components/FarmerForm";

export default function FarmerProfile({ session, onLogout, onSessionChange }) {
  const [farmer, setFarmer] = useState(session.farmer);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const fresh = await fetchFarmerProfile(session.farmer.farmer_id);
        if (fresh) {
          setFarmer(fresh);
          localStorage.setItem("terrasync_farmer", JSON.stringify(fresh));
          onSessionChange({ type: "farmer", farmer: fresh });
        }
      } catch (err) {
        setError(err.message || "Unable to refresh your profile.");
      }
    })();
  }, [session.farmer.farmer_id]);

  async function save(form) {
    setSaving(true);
    setError("");
    try {
      const updated = await editOwnFarmerProfile(farmer.farmer_id, form);
      setFarmer(updated);
      localStorage.setItem("terrasync_farmer", JSON.stringify(updated));
      onSessionChange({ type: "farmer", farmer: updated });
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <Header
        title="Farmer Profile"
        subtitle="Your TerraSync account"
        userLabel={farmer.name}
        userRole="Farmer"
        onLogout={onLogout}
        notificationCount={1}
      />

      <main className="content">
        <section className="profile-panel farmer-profile-card">
          <div className="profile-top">
            <div className="profile-avatar"><UserRound size={29} /></div>
            <div className="profile-heading">
              <span className={`status ${farmer.status}`}>{farmer.status}</span>
              <h2>{farmer.name}</h2>
              <p>RSBSA: {farmer.rsbsa_number}</p>
            </div>
            <button className="button primary" onClick={() => setModalOpen(true)}><Edit3 size={17} /> Edit Profile</button>
          </div>

          {error && <div className="page-error">{error}</div>}

          <div className="profile-fields">
            <Info icon={Mail} label="Email" value={farmer.email} />
            <Info icon={Phone} label="Phone" value={farmer.phone} />
            <Info icon={MapPin} label="Address" value={farmer.address} />
            <Info icon={Sprout} label="Crops" value={farmer.crops} />
          </div>
        </section>

        <section className="panel farmer-notice">
          <h2>Account access</h2>
          <p>You are signed in with farmer privileges. You can view and update only your own farmer record.</p>
        </section>
      </main>

      <Modal open={modalOpen} title="Update My Profile" subtitle="Changes are saved directly to Supabase" onClose={() => !saving && setModalOpen(false)} wide>
        <FarmerForm farmer={farmer} selfEdit onSubmit={save} onCancel={() => setModalOpen(false)} submitting={saving} />
      </Modal>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="info-item">
      <div className="info-icon"><Icon size={18} /></div>
      <div><span>{label}</span><strong>{value || "—"}</strong></div>
    </div>
  );
}
