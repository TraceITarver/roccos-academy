// ===== Rocco's Academy configuration =====
// TODO(Trace): paste your RevenueCat *public iOS SDK key* (starts with "appl_") from
// RevenueCat dashboard → Project → API keys. Leave as-is until you have one.
const CONFIG={
 REVENUECAT_IOS_API_KEY:"REVENUECAT_IOS_API_KEY_HERE",
 ENTITLEMENT:"plus",
 PRODUCTS:{monthly:"roccos_plus_monthly",yearly:"roccos_plus_yearly"},
 PRICES:{monthly:"$4.99/month",yearly:"$29.99/year"}, // display fallback; App Store prices from RevenueCat override these
 // TODO(Trace): replace with your Amazon Associates tracking ID (e.g. "yourname-20")
 AFFILIATE_TAG:"AFFILIATE_TAG_HERE",
 FREE_LESSONS:["name","sit","down","stay","come","potty","crate"]
};
const GEAR=[
 {id:"clicker",icon:"🔘",name:"Training clicker",q:"dog training clicker",blurb:"A distinct click marks the exact moment your dog gets it right. Cheap and handy, but optional: a consistent 'Yes!' works too (or use the in-app clicker)."},
 {id:"pouch",icon:"👝",name:"Treat pouch",q:"dog treat training pouch",blurb:"Keeps rewards at your hip so you can pay fast. Look for one with a magnetic or hinge closure you can open one-handed."},
 {id:"treats",icon:"🍖",name:"High-value training treats",q:"soft small dog training treats",blurb:"Small, soft, smelly treats your dog can eat in a second. Pea-sized pieces are plenty. Plain cooked chicken works great too."},
 {id:"harness",icon:"🦺",name:"Front-clip harness",q:"front clip no pull dog harness",blurb:"The leash clips at the chest, which gently turns your dog toward you when they pull. It's a management tool while you train loose-leash walking, not a fix by itself."},
 {id:"leash",icon:"🦮",name:"6 ft leash",q:"6 ft dog leash",blurb:"A standard fixed-length leash gives consistent feedback. Skip retractable leashes while training, because they reward pulling."},
 {id:"longline",icon:"🧵",name:"Long line (15–30 ft)",q:"long line dog leash 30 ft",blurb:"Lets you practice recall with freedom and safety. Attach it to a harness, not a collar, and wear gloves if your dog is strong."},
 {id:"crate",icon:"🏠",name:"Crate",q:"dog crate with divider",blurb:"Choose one your dog can stand, turn, and lie down in. A divider lets a puppy's crate grow with them."},
 {id:"lickmat",icon:"🧩",name:"Lick mat / puzzle toy",q:"dog lick mat puzzle toy",blurb:"Licking and sniffing are calming. Great for crate time, alone-time practice, grooming, and settle training."}
];
const LESSON_GEAR={name:["treats","clicker"],sit:["treats","clicker"],come:["longline","treats"],leash:["harness","leash","pouch"],crate:["crate","lickmat"],potty:["treats","pouch"],settle:["lickmat"],drop:["treats"],social:["treats","pouch"],stay:["treats"],wait:["treats"],leaveit:["treats"],down:["treats"]};
