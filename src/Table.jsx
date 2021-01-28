import React, { useCallback, useMemo } from "react";
import { useTable } from "react-table";
import { atom as Atom, selector, useRecoilState, useResetRecoilState } from "recoil";

const getKey = () => {
  const s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  return s4() + s4();
};

const makeAtom = ({ defaultVal = "" } = {}) => {
  const key = getKey();
  const newAtom = Atom({
    key,
    default: defaultVal,
  });
  return newAtom;
};

const getTotalSelector = (atoms) => {
  const key = getKey();
  return selector({
    key,
    get: ({ get }) => {
      return atoms.reduce((total, atom) => {
        return total + Number(get(atom));
      }, 0);
    },
    set: ({ set }, newValue) => {
      const avg = newValue / atoms.length;
      atoms.forEach((atom) => set(atom, avg));
    },
  });
};
const getResetSelector = (atoms) => {
  const key = getKey();
  return selector({
    key,
    get: ({ get }) => {
      return atoms.reduce((total, atom) => {
        return total + Number(get(atom));
      }, 0);
    },
    set: ({ reset }, newValue) => {
      if (newValue === "RESET") {
        atoms.forEach((atom) => reset(atom));
      }
    },
  });
};

function Table({ columns, data }) {
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({
    columns,
    data,
    // defaultColumn,
  });
  console.log("🚀 Table renders");

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const TableCell = (props) => {
  const {
    value: propVal,
    row: {
      original: { readOnly: readOnlyRow, isResetable: isResetableRow },
    },
    column: { readOnly: readOnlyColumn, isResetable: isResetableColumn },
  } = props;

  const [value, setValue] = useRecoilState(propVal);
  const reset = useResetRecoilState(propVal);

  const onClick = useCallback((e) => {
    e.target.focus();
    e.target.select();
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && isResetableRow !== false && isResetableColumn !== false) {
        reset();
      }
    },
    [reset, isResetableRow, isResetableColumn]
  );

  const onChange = useCallback(
    (e) => {
      const newValue = Number(e.target.value);
      if (!Number.isNaN(newValue)) {
        setValue(newValue);
      }
    },
    [setValue]
  );

  if (readOnlyRow || readOnlyColumn) {
    return <div>{value}</div>;
  }
  return (
    <div style={{ display: "flex" }}>
      <input style={{ width: "60px" }} value={value} onChange={onChange} onKeyDown={onKeyDown} onClick={onClick} />
    </div>
  );
};

function Resetter(props) {
  const { atoms } = props;
  const resetFn = useRecoilState(atoms)[1];
  const reset = useCallback(() => {
    resetFn("RESET");
  }, [resetFn]);
  return <button onClick={reset}>RESET</button>;
}

export function RTable() {
  
  const READ_ONLY_TOTALS = true;

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "firstName",
        readOnly: true,
        Cell: (props) => {
          return <div>{props.value}</div>;
        },
      },
      ...months.map((month) => ({
        Header: month,
        accessor: month,
        Cell: TableCell,
      })),
      {
        Header: "total",
        accessor: "total",
        isResetable: false,
        readOnly: READ_ONLY_TOTALS,
        Cell: TableCell,
      },
    ],
    [READ_ONLY_TOTALS]
  );

  const { data, atoms } = useMemo(() => {
    const atomsInRows = [];
    const totalSelectors = [];
    const returnThis = {
      data: [
        ...months.map((month, i, arr) => {
          const row = {
            firstName: month,
            isResetable: true,
          };
          const atomsInRow = [];
          const atoms = arr.map((m, idx) => {
            const atom = makeAtom({ defaultVal: i + idx });
            row[m] = atom;
            atomsInRow.push(atom);
            return atom;
          });
          atomsInRows.push(atomsInRow);
          row.total = getTotalSelector(atoms);

          return row;
        }),
        {
          firstName: "totals",
          readOnly: READ_ONLY_TOTALS,
          isResetable: false,
          ...months.reduce((acc, month, i) => {
            const atoms = atomsInRows.map((row) => {
              return row[i];
            });
            const selector = getTotalSelector(atoms);
            totalSelectors.push(selector);
            acc[month] = selector;
            return acc;
          }, {}),
          total: getTotalSelector(totalSelectors),
        },
      ],
    };
    returnThis.atoms = atomsInRows.flat(Infinity);
    returnThis.totalSelectors = totalSelectors;
    return returnThis;
  }, [READ_ONLY_TOTALS]);
  const selector = useMemo(() => getResetSelector(atoms), [atoms]);

  return (
    <>
      <Resetter atoms={selector} />
      <Table columns={columns} data={data} />
    </>
  );
}

export default RTable;
