import * as XLSX from 'xlsx';
import { Member } from '../types';

export function exportMembersToExcel(members: Member[], filename = 'KPG_Darlawn_Members_2026.xlsx') {
  const data = members.map((m, index) => ({
    'Sl. No': index + 1,
    'Hming': m.hming,
    'Veng': m.veng,
    'Phone': m.phone,
    'Role': m.role,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KPG Members');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // Sl
    { wch: 25 }, // Hming
    { wch: 18 }, // Veng
    { wch: 15 }, // Phone
    { wch: 20 }, // Role
  ];

  XLSX.writeFile(workbook, filename);
}
