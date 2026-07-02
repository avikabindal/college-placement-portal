const statusConfig = {
  applied:            { label: "Applied",             className: "bg-blue-100 text-blue-700" },
  under_review:       { label: "Under Review",        className: "bg-yellow-100 text-yellow-700" },
  shared_with_company:{ label: "Shared with Company", className: "bg-purple-100 text-purple-700" },
  shortlisted:        { label: "Shortlisted",         className: "bg-indigo-100 text-indigo-700" },
  assessment:         { label: "Assessment",          className: "bg-orange-100 text-orange-700" },
  interview:          { label: "Interview",           className: "bg-cyan-100 text-cyan-700" },
  selected:           { label: "Selected",            className: "bg-green-100 text-green-700" },
  rejected:           { label: "Rejected",            className: "bg-red-100 text-red-700" },
  open:               { label: "Open",                className: "bg-green-100 text-green-700" },
  closed:             { label: "Closed",              className: "bg-gray-100 text-gray-500" },
};

const StatusBadge = ({ status, size = "sm" }) => {
  const config = statusConfig[status] || {
    label: status?.replace(/_/g, " ") || "Unknown",
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium ${
      size === "sm" ? "text-xs" : "text-sm"
    } ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;