const StatCard = ({ label, value, icon, color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red:    "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    cyan:   "bg-cyan-50 text-cyan-600",
    gray:   "bg-gray-50 text-gray-600",
  };

  const textColors = {
    indigo: "text-indigo-600",
    blue:   "text-blue-600",
    green:  "text-green-600",
    yellow: "text-yellow-600",
    red:    "text-red-600",
    purple: "text-purple-600",
    cyan:   "text-cyan-600",
    gray:   "text-gray-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${textColors[color]}`}>
        {value ?? 0}
      </p>
    </div>
  );
};

export default StatCard;