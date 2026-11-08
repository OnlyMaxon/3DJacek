// Короткий сортируемый id: время в base36 плюс случайный хвост.
// uuid здесь избыточен — id нужен только как имя папки на диске.
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
