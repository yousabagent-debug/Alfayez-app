const DB_NAME = 'alfayez_db';
const DB_VER = 1;
let db;

// دالة فتح قاعدة البيانات وإنشاء الجداول
function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VER);
        
        req.onupgradeneeded = (e) => {
            const d = e.target.result;
            // إنشاء الجداول لو مش موجودة
            if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings', { keyPath: 'key' });
            if (!d.objectStoreNames.contains('branches')) d.createObjectStore('branches', { keyPath: 'id', autoIncrement: true });
            if (!d.objectStoreNames.contains('companies')) d.createObjectStore('companies', { keyPath: 'id', autoIncrement: true });
            if (!d.objectStoreNames.contains('items')) d.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
            if (!d.objectStoreNames.contains('additions')) d.createObjectStore('additions', { keyPath: 'id', autoIncrement: true });
            if (!d.objectStoreNames.contains('shifts')) d.createObjectStore('shifts', { keyPath: 'id', autoIncrement: true });
            if (!d.objectStoreNames.contains('invoices')) d.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
            if (!d.objectStoreNames.contains('expenses')) d.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
        };

        req.onsuccess = (e) => { db = e.target.result; resolve(); };
        req.onerror = (e) => reject(e);
    });
}

// دوال مساعدة للتعامل مع قاعدة البيانات
const getStore = (store, mode = 'readonly') => db.transaction(store, mode).objectStore(store);

const getAll = (store) => new Promise(r => { 
    const q = getStore(store).getAll(); 
    q.onsuccess = () => r(q.result); 
});

const getById = (store, id) => new Promise(r => { 
    const q = getStore(store).get(id); 
    q.onsuccess = () => r(q.result); 
});

const addItem = (store, item) => new Promise(r => { 
    const q = getStore(store, 'readwrite').add(item); 
    q.onsuccess = () => r(q.result); 
});

const updateItem = (store, item) => new Promise(r => { 
    const q = getStore(store, 'readwrite').put(item); 
    q.onsuccess = () => r(q.result); 
});

const deleteItem = (store, id) => new Promise(r => { 
    const q = getStore(store, 'readwrite').delete(id); 
    q.onsuccess = () => r(); 
});

// دالة تهيئة البيانات الأولية (أول مرة بس)
async function seedData() {
    const settings = await getAll('settings');
    if (settings.length > 0) return; // لو البيانات موجودة متعملهاش تاني

    // إعدادات المدير (الباسورد الافتراضي)
    await addItem('settings', { key: 'manager_pass', value: '1358' });
    
    // الفروع الأساسية (هنخليهم عشان تقدر تدخل وتجرب، وتقدر تغيرهم بعدين)
    await addItem('branches', { name: 'السيد هاشم', pass: '123' });
    await addItem('branches', { name: 'الأربعين', pass: '123' });

    // ملاحظة: الشركات والأصناف هنضيفها إحنا من داخل التطبيق زي ما طلبت
}

// تشغيل قاعدة البيانات أول ما الملف يفتح
initDB().then(() => {
    seedData();
}).catch(err => console.error("DB Error:", err));
