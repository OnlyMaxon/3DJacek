/**
 * Сырой JSON, который RoomPlan пишет рядом с usdz. Это Codable-дамп
 * структуры CapturedRoom, поэтому форма диктуется Swift, а не нами.
 *
 * Все поля опциональные сознательно: состав JSON меняется между версиями iOS,
 * и единственный способ не ломаться на обновлении — ничего не считать обязательным.
 */

/**
 * Категория приезжает в двух видах, и это не баг:
 *   - у объектов Swift-энам без ассоциированных значений → строка: "chair"
 *   - у поверхностей энам со значениями → объект: {"door":{"isOpen":false}}
 */
export type RawCategory = string | Record<string, unknown>;

export type RawElement = {
  identifier?: string;
  category?: RawCategory;
  confidence?: RawCategory;
  /** [ширина, высота, глубина] в метрах */
  dimensions?: number[];
  /** 16 чисел, матрица 4×4 column-major, центрированная на элементе */
  transform?: number[];
  parentIdentifier?: string | null;
  story?: number;
};

export type RawCapturedRoom = {
  version?: number;
  walls?: RawElement[];
  doors?: RawElement[];
  windows?: RawElement[];
  openings?: RawElement[];
  objects?: RawElement[];
  floors?: RawElement[];
  sections?: unknown[];
};
