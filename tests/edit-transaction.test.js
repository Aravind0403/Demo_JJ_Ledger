import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editTransaction } from '../src/lib/editTransaction.js';

const pairs = [['RETAIL','CASH','retailCash'],['RETAIL','GOLD','retailGold'],['BULLION','CASH','bullionCash'],['BULLION','GOLD','bullionGold'],['BULLION','SILVER','bullionSilver'],['SILVER','CASH','silverCash'],['SILVER','SILVER','silverSilver'],['CHIT','CASH','chitCash']];
const setup = (category = 'RETAIL', type = 'CASH', key = 'retailCash') => {
    const tx = { id:'a', cid:'c', category, type, jama:100, nave:0, direction:'IN', date:'2026-10-20', createdAt:1, currentBalance:10, newBalance:110, bill_number:'FIRST', bill_amount:0, grams:type === 'CASH' ? 0 : 100, description:'Original', images:[{url:'photo'}] };
    return { transactions:[tx, {...tx,id:'b',jama:0,nave:30,direction:'OUT',createdAt:2,bill_number:'SECOND',currentBalance:110,newBalance:80}],
        deletedTransactions:[], customers:[{id:'c',[key]:80,cashBalance:80,goldBalance:80,silverBalance:80},{id:'other',cashBalance:25}],
        role:'owner',id:'a',expectedRevision:0, changes:{ amount:'90',direction:'IN',bill_number:' corrected ',bill_amount:'0',date:'2026-10-19',description:'Corrected',reason:'Wrong amount' } };
};
for (const [category,type,key] of pairs) test(`${category} ${type}: correction preserves opening balance and updates later balances`, () => {
    const input = setup(category,type,key);
    const result = editTransaction(input);
    assert.equal(result.customers[0][key],70);
    assert.equal(result.transactions[0].currentBalance,10);
    assert.equal(result.transactions[0].newBalance,100);
    assert.equal(result.transactions[1].currentBalance,100);
    assert.equal(result.transactions[1].newBalance,70);
    assert.equal(result.transactions[0].bill_number,'CORRECTED');
    assert.deepEqual(result.transactions[0].images,input.transactions[0].images);
    assert.equal(result.transactions[0].createdAt,1);
    assert.equal(result.transactions[0].editHistory[0].before.jama,100);
    assert.equal(result.transactions[0].editHistory[0].after.jama,90);
    assert.deepEqual(result.customers[1],input.customers[1]);
    assert.equal(input.transactions[0].jama,100);
});
test('direction reversal, repeated edit, and three-decimal metal precision', () => {
    const input = setup('BULLION','GOLD','bullionGold');
    input.changes.amount = '1.125'; input.changes.direction = 'OUT';
    let result = editTransaction(input);
    assert.equal(result.customers[0].bullionGold,-21.125);
    assert.equal(result.transactions[0].grams,1.125);
    result = editTransaction({...input,...result,expectedRevision:1,changes:{...input.changes,amount:'2.125'}});
    assert.equal(result.customers[0].bullionGold,-22.125);
    assert.equal(result.transactions[0].editHistory.length,2);
});
test('reject restricted roles, stale edits, duplicates, invalid amount/date, missing reason and deleted entry', () => {
    const input = setup();
    for (const role of ['staff','view',undefined]) assert.throws(() => editTransaction({...input,role}),/Only the owner/);
    assert.throws(() => editTransaction({...input,expectedRevision:2}),/changed/);
    for (const amount of ['0','-10','NaN','Infinity','1.125']) assert.throws(() => editTransaction({...input,changes:{...input.changes,amount}}),/amount/);
    assert.throws(() => editTransaction({...input,changes:{...input.changes,bill_number:'second'}}),/already exists/);
    assert.throws(() => editTransaction({...input,deletedTransactions:[{id:'deleted',bill_number:'CORRECTED'}]}),/already exists/);
    assert.throws(() => editTransaction({...input,changes:{...input.changes,date:'2026-02-30'}}),/valid date/);
    assert.throws(() => editTransaction({...input,changes:{...input.changes,reason:' '}}),/reason/);
    assert.throws(() => editTransaction({...input,id:'missing'}),/no longer/);
});
test('metadata-only edit leaves balances unchanged and allows blank bill', () => {
    const input = setup();
    const result = editTransaction({...input,changes:{...input.changes,amount:100,bill_number:''}});
    assert.equal(result.customers[0].retailCash,80);
    assert.equal(result.transactions[1].newBalance,80);
    assert.equal(result.transactions[0].bill_number,null);
});

test('moving silver cash to silver weight restores source and destination opening balances', () => {
    const input = setup('SILVER', 'CASH', 'silverCash');
    input.transactions[0].sub_type = 'CASH';
    input.transactions.push({...input.transactions[0],id:'metal',type:'SILVER',sub_type:'SILVER',jama:5,nave:0,createdAt:3});
    Object.assign(input.customers[0], {silverSilver:7,silverBalance:7});
    const result = editTransaction({...input,changes:{...input.changes,sub_type:'SILVER',amount:'2.125'}});
    assert.equal(result.customers[0].silverCash,-20);
    assert.equal(result.customers[0].cashBalance,-20);
    assert.equal(result.customers[0].silverSilver,9.125);
    assert.equal(result.customers[0].silverBalance,9.125);
    assert.equal(result.transactions[1].currentBalance,10);
    assert.equal(result.transactions[1].newBalance,-20);
    assert.equal(result.transactions[0].currentBalance,2);
    assert.equal(result.transactions[2].currentBalance,4.125);
    assert.equal(result.transactions[0].editHistory[0].before.type,'CASH');
    assert.equal(result.transactions[0].editHistory[0].after.type,'SILVER');
    const back = editTransaction({...input,...result,expectedRevision:1,changes:{...input.changes,sub_type:'CASH',amount:100}});
    assert.equal(back.customers[0].silverCash,80);
    assert.equal(back.customers[0].silverSilver,7);
    assert.equal(back.transactions[2].currentBalance,2);
});

test('retail cash to metal keeps cash accounting and records property weight', () => {
    const input = setup(); input.transactions[0].sub_type='CASH';
    const result = editTransaction({...input,changes:{...input.changes,amount:100,sub_type:'METAL',grams:'2.125',metal_type:'GOLD'}});
    assert.equal(result.customers[0].retailCash,80);
    assert.equal(result.transactions[0].type,'CASH');
    assert.equal(result.transactions[0].grams,2.125);
    assert.equal(result.transactions[0].sub_type,'METAL');
});

test('bullion gold to silver and chit scheme corrections', () => {
    const input = setup('BULLION','GOLD','bullionGold'); input.transactions[0].sub_type='GOLD';
    const result = editTransaction({...input,changes:{...input.changes,sub_type:'SILVER',amount:4}});
    assert.equal(result.customers[0].bullionGold,-20);
    assert.equal(result.customers[0].bullionSilver,4);
    const chit = setup('CHIT','CASH','chitCash'); chit.transactions[0].chit_scheme='CHIT';
    const changed = editTransaction({...chit,changes:{...chit.changes,amount:100,chit_scheme:'DIWALI FUND'}});
    assert.equal(changed.customers[0].chitCash,80);
    assert.equal(changed.transactions[0].editHistory[0].after.chit_scheme,'DIWALI FUND');
    assert.throws(() => editTransaction({...input,changes:{...input.changes,sub_type:'METAL'}}),/subcategory/);
});
