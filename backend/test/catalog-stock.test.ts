import {test} from 'node:test';import assert from 'node:assert/strict';import {availableQuantity,hasStock} from '../src/services/catalog-stock.js';
for(const [name,value,expected] of [
 ['unknown',{},0],['explicit absent',{available:false,inStock:20},0],['zero beats flag',{available:true,inStock:0},0],
 ['conflicting counts',{inStock:5,stock:0},0],['count',{inStock:3},3],['explicit bounded',{available:true},1],
 ['invalid',{stock:-1},0],['fraction',{stock:1.5},0],['long order is not stock',{isLongOrder:true,inStock:0},0]
] as const)test(name,()=>assert.equal(availableQuantity(value),expected));
test('quantity must fit conservative stock',()=>{assert.equal(hasStock({inStock:2,stock:1},2),false);assert.equal(hasStock({available:true},1),true);assert.equal(hasStock({available:true},2),false);assert.equal(hasStock({inStock:10},0),false);});
