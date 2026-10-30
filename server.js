const express = require('express');
const app = express();
app.use(express.json());

let data = {
  totalEarn: 0, // USD from Monetag/Adsterra
  totalPaid: 0, // Naira paid to users
  withdrawals: [],
  dailyLog: []
};

app.get('/api/finance', (req,res)=> res.json(data));

app.post('/api/add-earn', (req,res)=>{
  const {amount, source} = req.body;
  data.totalEarn += parseFloat(amount);
  data.dailyLog.push({type:'EARN', amount, source: source||'Monetag/Adsterra', date: new Date().toLocaleString()});
  res.json(data);
});

app.post('/api/add-paid', (req,res)=>{
  const {phone, amount, method} = req.body;
  data.totalPaid += parseFloat(amount);
  data.withdrawals.push({phone, amount, method, date: new Date().toLocaleString(), status:'PAID'});
  data.dailyLog.push({type:'PAID', amount, phone, date: new Date().toLocaleString()});
  res.json(data);
});

app.post('/api/reset', (req,res)=>{
  data = {totalEarn:0, totalPaid:0, withdrawals:[], dailyLog:[]};
  res.json(data);
});

app.get('/', (req,res)=> res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gray-100 p-3">
<div class="max-w-md mx-auto">
<div class="bg-white rounded-2xl p-5 shadow-xl mt-2">
<h2 class="font-bold text-xl">💰 Adebisi Finance Tracker</h2>
<p class="text-xs text-gray-500">abdulrazaqadebisi2@gmail.com | 08072868277</p>

<div class="grid grid-cols-2 gap-3 mt-4">
<div class="bg-green-50 p-4 rounded-xl border"><p class="text-xs text-gray-500">Total Earn (Ads)</p><p class="font-bold text-lg text-green-600" id="earn">$0</p><p class="text-xs" id="earnN">N0</p></div>
<div class="bg-red-50 p-4 rounded-xl border"><p class="text-xs text-gray-500">Total Paid (Users)</p><p class="font-bold text-lg text-red-600" id="paidN">N0</p><p class="text-xs" id="paidD">$0</p></div>
<div class="bg-blue-600 text-white p-4 rounded-xl col-span-2"><p class="text-xs opacity-80">NET PROFIT</p><p class="font-bold text-2xl" id="profit">N0</p><p class="text-xs" id="profitD">$0</p></div>
</div>

<div class="mt-5 bg-gray-50 p-4 rounded-xl">
<h3 class="font-bold text-sm">➕ Add Ad Earning (Daily)</h3>
<p class="text-xs text-gray-500">Check Monetag.com daily earning, enter here</p>
<div class="flex gap-2 mt-2">
<input id="earnAmount" type="number" step="0.01" placeholder="e.g 6.72" class="flex-1 p-3 border rounded-xl">
<select id="earnSource" class="p-3 border rounded-xl"><option>Monetag</option><option>Adsterra</option></select>
</div>
<button onclick="addEarn()" class="w-full mt-2 p-3 bg-green-600 text-white rounded-xl font-bold">Add Earning</button>
</div>

<div class="mt-3 bg-gray-50 p-4 rounded-xl">
<h3 class="font-bold text-sm">➖ Add Paid to User</h3>
<input id="paidPhone" placeholder="User phone e.g 0807..." class="w-full p-3 border rounded-xl mt-2">
<div class="flex gap-2 mt-2">
<input id="paidAmount" type="number" placeholder="Amount N500" value="500" class="flex-1 p-3 border rounded-xl">
<select id="paidMethod" class="p-3 border rounded-xl"><option>MTN</option><option>Airtel</option><option>Opay</option></select>
</div>
<button onclick="addPaid()" class="w-full mt-2 p-3 bg-red-600 text-white rounded-xl font-bold">Add Paid</button>
</div>

<div class="mt-5">
<h3 class="font-bold text-sm">📋 Recent Transactions</h3>
<div id="log" class="mt-2 text-xs max-h-[300px] overflow-y-auto"></div>
<button onclick="resetData()" class="w-full mt-4 p-2 text-xs text-gray-400">Reset All Data</button>
</div>

</div>
<p class="text-[10px] text-center text-gray-400 mt-3">Exchange: $1 = N1500 | Your link: /api/finance to see raw data</p>
</div>

<script>
const RATE = 1500;
async function load(){
 let d = await fetch('/api/finance').then(r=>r.json());
 document.getElementById('earn').innerText = '$'+d.totalEarn.toFixed(2);
 document.getElementById('earnN').innerText = 'N'+(d.totalEarn*RATE).toLocaleString();
 document.getElementById('paidN').innerText = 'N'+d.totalPaid.toLocaleString();
 document.getElementById('paidD').innerText = '$'+(d.totalPaid/RATE).toFixed(2);
 let profitN = (d.totalEarn*RATE) - d.totalPaid;
 let profitD = d.totalEarn - (d.totalPaid/RATE);
 document.getElementById('profit').innerText = 'N'+profitN.toLocaleString();
 document.getElementById('profitD').innerText = '$'+profitD.toFixed(2) + ' profit';
 document.getElementById('log').innerHTML = d.dailyLog.slice().reverse().map(l=>{
   if(l.type==='EARN') return '<div class="flex justify-between p-2 bg-green-50 rounded mb-1"><span>💰 +$'+l.amount+' '+l.source+'</span><span class="text-gray-500">'+l.date+'</span></div>';
   else return '<div class="flex justify-between p-2 bg-red-50 rounded mb-1"><span>💸 -N'+l.amount+' to '+l.phone+'</span><span class="text-gray-500">'+l.date+'</span></div>';
 }).join('') || '<p class="text-gray-400 text-center py-4">No transactions yet</p>';
}
async function addEarn(){
 let a=document.getElementById('earnAmount').value; let s=document.getElementById('earnSource').value;
 if(!a) return alert('Enter amount');
 await fetch('/api/add-earn',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({amount:a, source:s})});
 document.getElementById('earnAmount').value=''; load();
}
async function addPaid(){
 let p=document.getElementById('paidPhone').value; let a=document.getElementById('paidAmount').value; let m=document.getElementById('paidMethod').value;
 if(!p || !a) return alert('Enter phone and amount');
 await fetch('/api/add-paid',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:p, amount:a, method:m})});
 document.getElementById('paidPhone').value=''; load();
}
async function resetData(){ if(confirm('Reset all?')){ await fetch('/api/reset',{method:'POST'}); load(); }}
load();
<\/script>
</body></html>
`));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Finance Tracker LIVE'));
