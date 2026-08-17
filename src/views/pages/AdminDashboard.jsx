import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UsersRound, Store, Leaf, PhilippinePeso, PackageOpen } from "lucide-react";
import { addFarmer, editFarmer, fetchFarmers, removeFarmer } from "../../controllers/farmerController";
import Header from "../components/Header";
import AdminNav from "../components/AdminNav";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import FarmerForm from "../components/FarmerForm";
import FarmerTable from "../components/FarmerTable";

export default function AdminDashboard({ session, onLogout }) {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, farmer: null });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setFarmers(await fetchFarmers());
    } catch (err) {
      setError(err.message || "Unable to load farmers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return farmers.filter((farmer) => {
      const matchesSearch =
        !q ||
        farmer.name.toLowerCase().includes(q) ||
        farmer.rsbsa_number.toLowerCase().includes(q) ||
        (farmer.email || "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || farmer.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [farmers, search, status]);

  const active = farmers.filter((f) => f.status === "active").length;
  const inactive = farmers.length - active;

  async function save(form) {
    setSaving(true);
    setError("");
    try {
      if (modal.farmer) {
        const updated = await editFarmer(modal.farmer.farmer_id, form);
        setFarmers((current) =>
          current.map((f) => (f.farmer_id === updated.farmer_id ? updated : f))
        );
      } else {
        const created = await addFarmer(form);
        setFarmers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setModal({ open: false, farmer: null });
    } catch (err) {
      setError(err.message || "Unable to save farmer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFarmer(farmer) {
    if (!window.confirm(`Delete ${farmer.name}? This cannot be undone.`)) return;
    try {
      await removeFarmer(farmer.farmer_id);
      setFarmers((current) => current.filter((f) => f.farmer_id !== farmer.farmer_id));
    } catch (err) {
      setError(err.message || "Unable to delete farmer.");
    }
  }

  return (
    <div className="app-shell">
      <Header
        title="Admin Manager"
        subtitle="TerraSync Farmer Management"
        userLabel={session.user.email}
        userRole="Administrator"
        onLogout={onLogout}
        notificationCount={0}
      />

      <main className="content">
        {/* <AdminNav /> */}

        <section className="stats-grid">
          <StatCard label="Total Farmers" value={farmers.length} note={`${inactive} inactive` } icon={UsersRound} accent="blue" />
          <StatCard label="Active Farmers" value={active} note="+8% from last month" icon={UsersRound} accent="green" />
          {/*
          <StatCard label="Carbon Credits (Q2)" value="1,870 kg CO₂" note="+12% from last month" icon={Leaf} accent="green" />
          <StatCard label="Financing Disbursed" value="₱232,000" note="+5% from last month" icon={PhilippinePeso} accent="orange" />
          <StatCard label="EOQ Fulfilled via Vendors" value="83%" note="+7% from last month" icon={PackageOpen} accent="purple" />
          */}
        </section>

        <section className="panel" id="farmers">
          <div className="panel-heading">
            <div>
              <h2>Registered Farmers</h2>
              <p>View, create and update farmer records</p>
            </div>
            <button className="button primary" onClick={() => setModal({ open: true, farmer: null })}>
              <Plus size={17} /> Add Farmer
            </button>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <Search size={17} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, RSBSA or email..." />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && <div className="page-error">{error}</div>}
          {loading ? <div className="loading-box">Loading farmers...</div> : <FarmerTable farmers={filtered} onEdit={(farmer) => setModal({ open: true, farmer })} onDelete={deleteFarmer} />}
        </section>

        <section className="panel activity-panel">
          <div>
            <h2>Recent Activity</h2>
            <p>Latest updates from farmers and vendors</p>
          </div>
          <div className="activity-row">
            <span className="activity-dot green"></span>
            <div><strong>Farmer records are synchronized with Supabase.</strong><small>Secure database access through RLS policies</small></div>
          </div>
        </section>
      </main>

      <Modal
        open={modal.open}
        title={modal.farmer ? "Update Farmer" : "Create Farmer"}
        subtitle={modal.farmer ? `Editing ${modal.farmer.name}` : "Add a new farmer to the registry"}
        onClose={() => !saving && setModal({ open: false, farmer: null })}
        wide
      >
        <FarmerForm farmer={modal.farmer} onSubmit={save} onCancel={() => setModal({ open: false, farmer: null })} submitting={saving} />
      </Modal>
    </div>
  );
}
