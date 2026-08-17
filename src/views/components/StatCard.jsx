export default function StatCard({ label, value, note, icon: Icon, accent = "" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">
        <span>{label}</span>
        <Icon size={17} className={accent} />
      </div>
      <strong>{value}</strong>
      {note && <small className="positive">{note}</small>}
    </div>
  );
}
