export const htmlToPlainText = (value) => {
    if (!value) return '';

    const html = String(value);

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');
    return (document.body.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
};
