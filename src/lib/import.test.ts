import { describe,it,expect } from 'vitest';
import {parseMemberRows} from './import';
describe('member import',()=>{
 it('preserves mobile leading zero and parses member data',()=>{expect(parseMemberRows([['no','name','phone'],['M-100','করিম','01700000001']]).members).toEqual([{member_no:'M-100',name:'করিম',phone:'01700000001',address:'',nid:''}]);});
 it('rejects duplicate existing numbers',()=>{const result=parseMemberRows([[],['M-100','করিম']],['M-100']);expect(result.errors).toHaveLength(1);expect(result.members).toHaveLength(0);});
 it('rejects duplicates in a single batch',()=>{const result=parseMemberRows([[],['M-100','করিম'],['M-100','রহিম']]);expect(result.members).toHaveLength(1);expect(result.errors).toHaveLength(1);});
 it('rejects a missing name',()=>{expect(parseMemberRows([[],['M-100','']]).errors).toHaveLength(1);});
});
