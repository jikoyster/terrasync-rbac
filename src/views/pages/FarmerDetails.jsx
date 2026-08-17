import { useEffect, useState } from "react";
import { ArrowLeft, Edit3 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { editFarmer, fetchFarmer } from "../../controllers/farmerController";
import Header from "../components/Header";
import Modal from "../components/Modal";
import FarmerForm from "../components/FarmerForm";

export default function FarmerDetails({ onLogout }) {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setFarmer(await fetchFarmer(farmerId));
      } catch (err) {
        setError(err.message || "Unable to load farmer.");
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId]);

  async function save(form) {
    setSaving(true);
    try {
      const updated = await editFarmer(farmerId, form);
      setFarmer(updated);
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Unable to update farmer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <Header
        title="Farmer Profile"
        subtitle="Full registered farmer record"
        userLabel="Administrator"
        userRole="Admin"
        onLogout={onLogout}
      />
      <main className="content">
        <div className="detail-back">
          <button onClick={() => navigate("/admin/dashboard")}><ArrowLeft size={16} /> Back to Farmers</button>
        </div>

        {loading && <div className="loading-box">Loading profile...</div>}
        {error && <div className="page-error">{error}</div>}

        {farmer && (
          <section className="profile-panel">
            <div className="profile-top">
              <div>
                <span className={`status ${farmer.status}`}>{farmer.status}</span>
                <h2>{farmer.name}</h2>
                <p>{farmer.rsbsa_number}</p>
              </div>
              <button className="button primary" onClick={() => setModalOpen(true)}><Edit3 size={17} /> Update</button>
            </div>

            <div className="detail-grid">
              <div><span>Email</span><strong>{farmer.email || "—"}</strong></div>
              <div><span>Phone</span><strong>{farmer.phone}</strong></div>
              <div><span>Crops</span><strong>{farmer.crops || "—"}</strong></div>
              <div><span>Address</span><strong>{farmer.address || "—"}</strong></div>
              <div><span>Registered</span><strong>{new Date(farmer.created_at).toLocaleDateString()}</strong></div>
              <div><span>Last Updated</span><strong>{new Date(farmer.updated_at).toLocaleDateString()}</strong></div>
            </div>
          </section>
        )}
      </main>

      <Modal open={modalOpen} title="Update Farmer" subtitle={`Editing ${farmer?.name || ""}`} onClose={() => !saving && setModalOpen(false)} wide>
        {farmer && <FarmerForm farmer={farmer} onSubmit={save} onCancel={() => setModalOpen(false)} submitting={saving} />}
      </Modal>
    </div>
  );
}
