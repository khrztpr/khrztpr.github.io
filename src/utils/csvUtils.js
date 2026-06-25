export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.map(line =>
    line
      .split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/)
      .map(c => c.replace(/^"|"$/g, '').trim())
  );
}

