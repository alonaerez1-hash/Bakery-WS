const assert=require('assert');
const Core=require('../core.js');

const settings={currency:'USD',hourlyRate:30,overheadPerHour:6,targetMargin:50};
const recipe={id:'r1',name:'Test Cake',yieldUnits:10,salePrice:15,targetMargin:50,laborMinutes:60,packagingPerUnit:1,fixedOverhead:4,wastePct:0,ingredients:[{name:'Flour',qty:1000,unit:'g',unitCost:.01}]};
const cost=Core.recipeCost(recipe,settings);
assert.strictEqual(Core.round(cost.ingredientCost,2),10);
assert.strictEqual(Core.round(cost.laborCost,2),30);
assert.strictEqual(Core.round(cost.packagingCost,2),10);
assert.strictEqual(Core.round(cost.overheadCost,2),10);
assert.strictEqual(Core.round(cost.batchCost,2),60);
assert.strictEqual(Core.round(cost.unitCost,2),6);
assert.strictEqual(Core.round(cost.suggestedPrice,2),12);
assert.strictEqual(Core.round(cost.unitProfit,2),9);
assert.strictEqual(Core.round(cost.margin,1),60);

const order={id:'o1',status:'Confirmed',deliveryFee:8,discount:3,extraCost:5,items:[{recipeId:'r1',qty:4,unitPrice:14}]};
const of=Core.orderFinancials(order,[recipe],settings);
assert.strictEqual(Core.round(of.revenue,2),61);
assert.strictEqual(Core.round(of.cost,2),29);
assert.strictEqual(Core.round(of.profit,2),32);
assert.strictEqual(Core.round(of.margin,2),52.46);

const orders=[order,{id:'o2',status:'Cancelled',items:[{recipeId:'r1',qty:100}]}];
const demand=Core.productionDemand(orders,[recipe]);
assert.deepStrictEqual(demand,[{recipeId:'r1',name:'Test Cake',units:4,batches:1}]);

const shopping=Core.shoppingList(orders,[recipe],[{name:'Flour',onHand:600,unit:'g'}]);
assert.strictEqual(shopping.length,1);
assert.strictEqual(shopping[0].name,'Flour');
assert.strictEqual(shopping[0].toBuy,400);

assert.strictEqual(Core.withinLimit('free','recipes',2),true);
assert.strictEqual(Core.withinLimit('free','recipes',3),false);
assert.strictEqual(Core.canUse('free','profitReports'),false);
assert.strictEqual(Core.canUse('pro','profitReports'),true);
assert.strictEqual(Core.currencyMeta('ILS').symbol,'₪');
assert.strictEqual(Core.currencyMeta('USD').symbol,'$');

console.log('Bakery WS V1 core tests passed.');
