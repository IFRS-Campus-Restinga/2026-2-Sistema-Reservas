// "2026-09-17" -> "17 set"
export function formatarDataCurta(dataISO) {
  const data = new Date(`${dataISO}T00:00:00`);
  return data
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}
