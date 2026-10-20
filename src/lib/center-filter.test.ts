import {describe,it,expect} from "vitest";
import {filterCenterRows} from "./center-filter";
describe("center-wise member data",()=>{
 const members=[{id:"a",center_id:"north"},{id:"b",center_id:"south"}];
 it("shows only members belonging to the selected center",()=>expect(filterCenterRows(members,"north",members,"members")).toEqual([members[0]]));
 it("shows only the selected center member's loans",()=>expect(filterCenterRows([{member_id:"a",amount:100},{member_id:"b",amount:200}],"south",members,"loans")).toEqual([{member_id:"b",amount:200}]));
 it("restores all members when all centers is chosen",()=>expect(filterCenterRows(members,"all",members,"members")).toHaveLength(2));
});