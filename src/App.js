import React from "react";
import RTable from "./Table";
import { RecoilRoot } from "recoil";

function App(props) {
  return (
    <div>
      <RecoilRoot>
        <RTable />
      </RecoilRoot>
    </div>
  );
}

export default App;
