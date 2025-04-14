import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 11);

export const generateId = () => {
  const now = new Date();
  const sec = Math.floor(now.getTime() / 1000);
  const msec = now.getMilliseconds();

  const hex = sec.toString(16) + msec.toString(16).padStart(5, "0");

  console.log("hex", hex);

  return hex + nanoid();
};
