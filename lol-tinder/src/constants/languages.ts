export const POPULAR_LANGUAGES: string[] = [
  "Ukrainian",
  "English",
  "Polish",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Romanian",
  "Dutch",
  "Hungarian",
  "Czech",
];

/** Languages list with leading "ANY" sentinel — used by rooms filters / create-room modal. */
export const ROOM_LANGUAGES: string[] = ["ANY", ...POPULAR_LANGUAGES];
