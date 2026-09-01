export const formatCurrency = (amount: number, currency = 'MAD') =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(amount);

export const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(dateStr)
  );
