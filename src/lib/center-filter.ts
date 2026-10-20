export function filterCenterRows<T>(rows:T[], center:string, members:{id:string;center_id:string|null}[], table:string):T[] {
 if(center==="all")return rows;
 const ids=new Set(members.filter(m=>m.center_id===center).map(m=>m.id));
 if(table==="members")return rows.filter(r=>ids.has((r as {id:string}).id));
 if(table==="centers")return rows.filter(r=>(r as {id:string}).id===center);
 return rows.filter(r=>{const entry=r as {member_id?:string|null};return !("member_id" in entry)||!!entry.member_id&&ids.has(entry.member_id);});
}