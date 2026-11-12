function normalizeSupplierName(value) {
  if (typeof value !== 'string') {
    throw new Error('O nome do fornecedor deve ser um texto.');
  }

  const cleanedName = value
    .normalize('NFC')
    .trim()
    .replace(/\s+/gu, ' ');

  if (!cleanedName) {
    throw new Error('O nome do fornecedor é obrigatório.');
  }

  if (cleanedName.length > 150) {
    throw new Error('O nome do fornecedor deve ter no máximo 150 caracteres.');
  }

  return cleanedName
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s-])(\p{L})/gu, (_, separator, letter) => {
      return separator + letter.toLocaleUpperCase('pt-BR');
    });
}

module.exports = normalizeSupplierName;