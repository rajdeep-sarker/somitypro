export type MemberImport = {member_no:string;name:string;phone:string;address:string;nid:string};
export function parseMemberRows(rows:unknown[][], existing:string[] = []) {
 const seen=new Set(existing);const errors:string[]=[];const members:MemberImport[]=[];
 rows.slice(1).forEach((row,i)=>{
  if(row.every(v=>v===null||v===undefined||String(v).trim()===""))return;
  const text=(n:number)=>String(row[n]??"").trim();
  const m={member_no:text(0),name:text(1),phone:text(2),address:text(3),nid:text(4)};
  if(!m.member_no||!m.name)errors.push(`সারি ${i+2}: সদস্য নম্বর ও নাম আবশ্যক`);
  else if(seen.has(m.member_no))errors.push(`সারি ${i+2}: ${m.member_no} নম্বরটি আগে আছে`);
  else {seen.add(m.member_no);members.push(m);}
 });return {members,errors};
}
export function csvDownload(name:string,rows:(string|number)[][]){
 const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
}
