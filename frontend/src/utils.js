export const formatTeamName = (name) => {
  if (!name) return 'A Definir';
  if (/^(W\d+|RU\d+|\d[A-Z]+)$/.test(name)) return 'A Definir';
  return name;
};
