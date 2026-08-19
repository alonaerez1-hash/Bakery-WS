(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BakeryWSCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const PLANS={
    free:{id:'free',name:'Free',recipeLimit:3,monthlyOrderLimit:10,inventory:true,profitReports:false,production:false},
    pro:{id:'pro',name:'Pro',recipeLimit:Infinity,monthlyOrderLimit:Infinity,inventory:true,profitReports:true,production:true}
  };

  const CURRENCIES={USD:{code:'USD',symbol:'$'},ILS:{code:'ILS',symbol:'₪'}};
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,num(v)));
  const round=(v,d=2)=>{const p=10**d;return Math.round((num(v)+Number.EPSILON)*p)/p};
  const currencyMeta=code=>CURRENCIES[code]||CURRENCIES.USD;

  function recipeCost(recipe,settings={}){
    const ingredients=(recipe?.ingredients||[]).reduce((sum,i)=>sum+Math.max(0,num(i.qty))*Math.max(0,num(i.unitCost)),0);
    const wastePct=Math.max(0,num(recipe?.wastePct));
    const ingredientCost=ingredients*(1+wastePct/100);
    const laborMinutes=Math.max(0,num(recipe?.laborMinutes));
    const hourlyRate=Math.max(0,num(recipe?.hourlyRateOverride??settings.hourlyRate));
    const laborCost=laborMinutes/60*hourlyRate;
    const yieldUnits=Math.max(0,Math.round(num(recipe?.yieldUnits)));
    const packagingPerUnit=Math.max(0,num(recipe?.packagingPerUnit));
    const packagingCost=yieldUnits*packagingPerUnit;
    const overheadPerHour=Math.max(0,num(settings.overheadPerHour));
    const overheadCost=laborMinutes/60*overheadPerHour+Math.max(0,num(recipe?.fixedOverhead));
    const batchCost=ingredientCost+laborCost+packagingCost+overheadCost;
    const unitCost=yieldUnits>0?batchCost/yieldUnits:null;
    const salePrice=Math.max(0,num(recipe?.salePrice));
    const targetMargin=clamp(recipe?.targetMargin??settings.targetMargin??45,0,95);
    const suggestedPrice=unitCost===null?null:unitCost/(1-targetMargin/100);
    const unitProfit=unitCost===null?null:salePrice-unitCost;
    const margin=salePrice>0&&unitProfit!==null?unitProfit/salePrice*100:null;
    return{ingredientCost,laborCost,packagingCost,overheadCost,batchCost,unitCost,yieldUnits,salePrice,targetMargin,suggestedPrice,unitProfit,margin};
  }

  function orderFinancials(order,recipes=[],settings={}){
    const map=new Map(recipes.map(r=>[r.id,r]));
    let productRevenue=0,productCost=0;
    const rows=(order?.items||[]).map(item=>{
      const recipe=map.get(item.recipeId);
      if(!recipe)return null;
      const qty=Math.max(0,num(item.qty));
      const cost=recipeCost(recipe,settings);
      const unitPrice=Math.max(0,num(item.unitPrice??recipe.salePrice));
      const revenue=qty*unitPrice;
      const trueCost=qty*Math.max(0,num(cost.unitCost));
      productRevenue+=revenue;productCost+=trueCost;
      return{recipeId:recipe.id,name:recipe.name,qty,unitPrice,revenue,cost:trueCost,profit:revenue-trueCost,unitCost:cost.unitCost};
    }).filter(Boolean);
    const deliveryFee=Math.max(0,num(order?.deliveryFee));
    const discount=Math.max(0,num(order?.discount));
    const extraCost=Math.max(0,num(order?.extraCost));
    const revenue=Math.max(0,productRevenue+deliveryFee-discount);
    const cost=productCost+extraCost;
    const profit=revenue-cost;
    const margin=revenue>0?profit/revenue*100:null;
    return{rows,productRevenue,productCost,deliveryFee,discount,extraCost,revenue,cost,profit,margin};
  }

  function portfolio(orders=[],recipes=[],settings={}){
    const active=orders.filter(o=>o.status!=='Cancelled');
    const details=active.map(order=>({order,...orderFinancials(order,recipes,settings)}));
    const revenue=details.reduce((s,x)=>s+x.revenue,0);
    const cost=details.reduce((s,x)=>s+x.cost,0);
    const profit=revenue-cost;
    return{details,revenue,cost,profit,margin:revenue>0?profit/revenue*100:null};
  }

  function productionDemand(orders=[],recipes=[]){
    const map=new Map(recipes.map(r=>[r.id,r]));
    const byRecipe=new Map();
    for(const order of orders.filter(o=>!['Delivered','Cancelled'].includes(o.status))){
      for(const item of order.items||[]){
        const recipe=map.get(item.recipeId);if(!recipe)continue;
        const prev=byRecipe.get(recipe.id)||{recipeId:recipe.id,name:recipe.name,units:0,batches:0};
        prev.units+=Math.max(0,num(item.qty));
        prev.batches=recipe.yieldUnits>0?Math.ceil(prev.units/recipe.yieldUnits):0;
        byRecipe.set(recipe.id,prev);
      }
    }
    return[...byRecipe.values()].sort((a,b)=>b.units-a.units);
  }

  function ingredientDemand(orders=[],recipes=[]){
    const map=new Map(recipes.map(r=>[r.id,r]));
    const out=new Map();
    for(const order of orders.filter(o=>!['Delivered','Cancelled'].includes(o.status))){
      for(const item of order.items||[]){
        const recipe=map.get(item.recipeId);if(!recipe||!recipe.yieldUnits)continue;
        const batches=Math.ceil(Math.max(0,num(item.qty))/recipe.yieldUnits);
        for(const ing of recipe.ingredients||[]){
          const key=String(ing.name||'').trim().toLowerCase();if(!key)continue;
          const prev=out.get(key)||{name:ing.name,qty:0,unit:ing.unit||'unit'};
          prev.qty+=Math.max(0,num(ing.qty))*batches;
          out.set(key,prev);
        }
      }
    }
    return[...out.values()].sort((a,b)=>a.name.localeCompare(b.name));
  }

  function shoppingList(orders=[],recipes=[],inventory=[]){
    const stock=new Map(inventory.map(i=>[String(i.name||'').trim().toLowerCase(),i]));
    return ingredientDemand(orders,recipes).map(need=>{
      const inv=stock.get(need.name.trim().toLowerCase());
      const onHand=Math.max(0,num(inv?.onHand));
      return{...need,onHand,toBuy:Math.max(0,need.qty-onHand)};
    }).filter(x=>x.toBuy>0);
  }

  function lowStock(inventory=[]){
    return inventory.filter(i=>Math.max(0,num(i.onHand))<=Math.max(0,num(i.reorderAt))).sort((a,b)=>(num(a.onHand)-num(a.reorderAt))-(num(b.onHand)-num(b.reorderAt)));
  }

  function canUse(planId,feature){const plan=PLANS[planId]||PLANS.free;return !!plan[feature];}
  function withinLimit(planId,type,count){const plan=PLANS[planId]||PLANS.free;const key=type==='recipes'?'recipeLimit':'monthlyOrderLimit';return count<plan[key];}

  return{PLANS,CURRENCIES,num,round,currencyMeta,recipeCost,orderFinancials,portfolio,productionDemand,ingredientDemand,shoppingList,lowStock,canUse,withinLimit};
});