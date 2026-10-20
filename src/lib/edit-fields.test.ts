import { describe, it, expect } from "vitest";
import { changedEntryValues, entryFields } from "./edit-fields";
describe("saved loan amount correction",()=>{
 it("submits the corrected loan principal without changing its member or deleting it",()=>{
  const row={principal:10000,member_id:"member-one",id:"loan-one"};
  expect(changedEntryValues(row,{principal:"12000"},entryFields("loans").filter(f=>f.key==="principal"))).toEqual({principal:12000});
 });
 it("rejects invalid loan amounts before saving",()=>{
  expect(()=>changedEntryValues({principal:10000},{principal:"invalid"},entryFields("loans").filter(f=>f.key==="principal"))).toThrow();
 });
});