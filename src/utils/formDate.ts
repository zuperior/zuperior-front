export const formatDate = (value: string | number) => {
  if (!value) return "-";
  let dateObj: Date;

  if (!isNaN(Number(value))) {
    const timestamp = Number(value);
    dateObj = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  } else {
    dateObj = new Date(value);
  }

  if (isNaN(dateObj.getTime())) return "-";

  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  const time = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${day}-${month}-${year} ${time}`;
};

export function getStatusColor(status?: string): string {
  if (!status) return "";
  switch (status.toLowerCase()) {
    case "success":
    case "completed":
    case "approved":
      return "dark:text-[#53C44B]/75 text-[#53C44B]";
    case "in process":
      return "dark:text-[#E9FF99]/75 text-[#c0e24d]";
    case "rejected":
    case "cancelled":
    case "failed":
      return "dark:text-[#FC6262]/75 text-[#FC6262]";
    case "pending":
      return "dark:text-[#E6A760]/75 text-[#E6A760]";
    default:
      return "";
  }
}

// Helper function to capitalize status text properly
export function formatStatusText(status?: string): string {
  if (!status) return "Success";

  // Handle special cases
  const normalized = status.toLowerCase();
  if (normalized === "in process") return "In Process";

  // Capitalize first letter of each word
  return status
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}