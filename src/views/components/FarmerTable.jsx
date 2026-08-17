import { Edit3, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function FarmerTable({ farmers, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Farmer</th>
            <th>RSBSA Number</th>
            <th>Crops</th>
            <th>Status</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((farmer) => (
            <tr key={farmer.farmer_id}>
              <td>
                <Link className="farmer-name" to={`/admin/farmers/${farmer.farmer_id}`}>
                  {farmer.name}
                </Link>
                <small>{farmer.email || "No email"}</small>
              </td>
              <td>{farmer.rsbsa_number}</td>
              <td>{farmer.crops || "—"}</td>
              <td>
                <span className={`status ${farmer.status}`}>{farmer.status}</span>
              </td>
              <td>{farmer.phone}</td>
              <td>
                <div className="row-actions">
                  <Link className="table-icon" to={`/admin/farmers/${farmer.farmer_id}`} title="View">
                    <Eye size={16} />
                  </Link>
                  <button className="table-icon" onClick={() => onEdit(farmer)} title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button className="table-icon danger" onClick={() => onDelete(farmer)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {farmers.length === 0 && (
            <tr>
              <td colSpan="6" className="empty-state">No farmers found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
