export const getValueLabel = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string
): string => {
  if (unit === "range") {
    return "Range";
  }

  switch (targetType) {
    case "power":
      if (unit === "watts") return "Power (watts)";
      if (unit === "percent_ftp") return "Power (% FTP)";
      if (unit === "zone") return "Power Zone (1-7)";
      return "Power Value";
    case "heart_rate":
      if (unit === "bpm") return "Heart Rate (BPM)";
      if (unit === "zone") return "HR Zone (1-5)";
      if (unit === "percent_max") return "Heart Rate (% Max)";
      return "Heart Rate Value";
    case "pace":
      if (unit === "mps") return "Pace (m/s)";
      if (unit === "zone") return "Pace Zone (1-5)";
      return "Pace Value";
    case "cadence":
      if (unit === "rpm") return "Cadence (RPM)";
      return "Cadence Value";
    default:
      return "Value";
  }
};

export const getValuePlaceholder = (
  targetType: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string
): string => {
  if (unit === "range") {
    return "";
  }

  switch (targetType) {
    case "power":
      if (unit === "watts") return "e.g., 250";
      if (unit === "percent_ftp") return "e.g., 85";
      if (unit === "zone") return "1-7";
      return "Enter value";
    case "heart_rate":
      if (unit === "bpm") return "e.g., 150";
      if (unit === "zone") return "1-5";
      if (unit === "percent_max") return "e.g., 85";
      return "Enter value";
    case "pace":
      if (unit === "mps") return "e.g., 3.5";
      if (unit === "zone") return "1-5";
      return "Enter value";
    case "cadence":
      if (unit === "rpm") return "e.g., 90";
      return "Enter value";
    default:
      return "Enter value";
  }
};
