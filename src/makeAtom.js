import { atom as Atom, selector } from "recoil";
import { getKey } from "./App";

export const makeAtom = ({ defaultVal = "" } = {}) => {
  const key = getKey();
  const newAtom = Atom({
    key,
    default: defaultVal,
  });
  return { key, atom: newAtom, defaultVal };
};
export const getTotalSelector = (atoms) => {
  const key = getKey();
  return selector({
    key,
    get: ({ get }) => {
      return atoms.reduce((total, { atom }) => {
        return total + Number(get(atom));
      }, 0);
    },
  });
};
export const getMultipleOfSelector = (atoms) => {
  const key = getKey();
  return selector({
    key,
    get: ({ get }) => {
      return atoms.reduce((total, { atom }) => {
        return total * Number(get(atom)) || 1;
      }, 1);
    },
  });
};
