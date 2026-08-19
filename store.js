(function(root){
  'use strict';
  const KEY='bakery_ws_v1_state';
  const SESSION_KEY='bakery_ws_v1_session';
  const now=new Date();
  const inDays=n=>{const d=new Date(now);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const seed={
    settings:{businessName:'Wildflower Bakes',currency:'USD',plan:'free',hourlyRate:24,overheadPerHour:7,targetMargin:45},
    customers:[
      {id:'cus_1',name:'Maya Thompson',email:'maya@example.com',phone:'(512) 555-0142'},
      {id:'cus_2',name:'Olivia Reed',email:'olivia@example.com',phone:'(737) 555-0188'}
    ],
    recipes:[
      {id:'rec_1',name:'Chocolate Chunk Cookies',category:'Cookies',yieldUnits:12,salePrice:4.5,targetMargin:45,laborMinutes:35,packagingPerUnit:.22,fixedOverhead:0,wastePct:4,ingredients:[
        {name:'Flour',qty:280,unit:'g',unitCost:.0016},{name:'Butter',qty:170,unit:'g',unitCost:.0105},{name:'Brown sugar',qty:180,unit:'g',unitCost:.0032},{name:'Chocolate',qty:220,unit:'g',unitCost:.0155},{name:'Eggs',qty:2,unit:'unit',unitCost:.34}
      ]},
      {id:'rec_2',name:'Vanilla Celebration Cake',category:'Cakes',yieldUnits:1,salePrice:72,targetMargin:50,laborMinutes:110,packagingPerUnit:4.25,fixedOverhead:2,wastePct:5,ingredients:[
        {name:'Flour',qty:420,unit:'g',unitCost:.0016},{name:'Butter',qty:340,unit:'g',unitCost:.0105},{name:'Sugar',qty:360,unit:'g',unitCost:.0023},{name:'Eggs',qty:5,unit:'unit',unitCost:.34},{name:'Cream',qty:500,unit:'ml',unitCost:.006}
      ]}
    ],
    orders:[
      {id:'ord_1',customerId:'cus_1',dueDate:inDays(2),status:'Confirmed',deliveryFee:8,discount:0,extraCost:0,items:[{recipeId:'rec_1',qty:24,unitPrice:4.5}]},
      {id:'ord_2',customerId:'cus_2',dueDate:inDays(5),status:'New',deliveryFee:0,discount:5,extraCost:0,items:[{recipeId:'rec_2',qty:1,unitPrice:72},{recipeId:'rec_1',qty:12,unitPrice:4.5}]}
    ],
    inventory:[
      {id:'inv_1',name:'Flour',onHand:1800,unit:'g',reorderAt:1000},
      {id:'inv_2',name:'Butter',onHand:500,unit:'g',reorderAt:600},
      {id:'inv_3',name:'Brown sugar',onHand:700,unit:'g',reorderAt:350},
      {id:'inv_4',name:'Chocolate',onHand:450,unit:'g',reorderAt:500},
      {id:'inv_5',name:'Eggs',onHand:18,unit:'unit',reorderAt:12},
      {id:'inv_6',name:'Cream',onHand:300,unit:'ml',reorderAt:500},
      {id:'inv_7',name:'Sugar',onHand:1200,unit:'g',reorderAt:600}
    ],
    production:[{id:'task_1',title:'Prep cookie dough',dueDate:inDays(1),done:false},{id:'task_2',title:'Bake celebration cake layers',dueDate:inDays(3),done:false}]
  };
  const clone=x=>JSON.parse(JSON.stringify(x));
  function load(){try{const raw=localStorage.getItem(KEY);if(raw)return{...clone(seed),...JSON.parse(raw)}}catch(e){}return clone(seed)}
  function save(state){localStorage.setItem(KEY,JSON.stringify(state));return state}
  function reset(){localStorage.removeItem(KEY);return load()}
  function session(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}}
  function setSession(value){if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(SESSION_KEY)}
  root.BakeryWSStore={KEY,SESSION_KEY,load,save,reset,session,setSession,seed:()=>clone(seed)};
})(typeof globalThis!=='undefined'?globalThis:this);