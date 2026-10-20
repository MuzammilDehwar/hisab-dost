// Format number to Pakistani Rupee string (e.g. 15,400)
export function formatPKR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return Math.round(val).toLocaleString('en-US');
}

// Format date to local readable format (e.g., 20 Oct 2026)
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Get today's ISO date string: YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Clean Pakistani phone numbers (e.g. 03001234567 -> 923001234567)
export function formatPakistaniPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  } else if (cleaned.startsWith('+92')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('92') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

// Build WhatsApp Web/App direct link
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = formatPakistaniPhoneForWhatsApp(phone);
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

// Safe CSV trigger download with UTF-8 BOM
export function downloadCSV(filename: string, rows: string[][]): void {
  // \uFEFF is the UTF-8 Byte Order Mark for Excel compatibility with Urdu & Arabic
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((item) => {
            const str = (item ?? '').toString().replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
