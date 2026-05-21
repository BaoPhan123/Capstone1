const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatCell = (value) => {
    if (value === null || value === undefined) return '';
    return escapeHtml(value);
};

export const exportRowsToExcel = ({ filename, sheetName, columns, rows }) => {
    const headerHtml = columns
        .map((column) => `<th>${escapeHtml(column.header)}</th>`)
        .join('');

    const bodyHtml = rows
        .map((row) => {
            const cells = columns
                .map((column) => `<td>${formatCell(column.value(row))}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8" />
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>${escapeHtml(sheetName || 'Sheet1')}</x:Name>
                                <x:WorksheetOptions><x:DisplayGridlines /></x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
            </head>
            <body>
                <table border="1">
                    <thead><tr>${headerHtml}</tr></thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
