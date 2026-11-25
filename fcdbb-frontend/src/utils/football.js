export const matchStatus = (match) =>
  match.report?.status === "completed"
    ? "Đã chốt kết quả"
    : match.report?.status === "cancelled"
      ? "Đã hủy"
      : new Date(match.end_time) < new Date()
        ? "Chờ biên bản"
        : new Date(match.start_time) > new Date()
          ? "Sắp diễn ra"
          : "Đang mở";
export const resultLabel = (report) =>
  report?.status !== "completed"
    ? "Chưa chốt kết quả"
    : report.score_a === report.score_b
      ? "Hai đội hòa nhau"
      : `Đội ${report.score_a > report.score_b ? "A" : "B"} chiến thắng`;
export const downloadCsv = (filename, rows) => {
  const cell = (v) => {
    const raw = String(v ?? "");
    return `"${(/^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw).replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const distanceFormat = new Intl.NumberFormat("vi-VN");
export const formatFieldDistance = (meters) =>
  `${distanceFormat.format(meters)} m`;
