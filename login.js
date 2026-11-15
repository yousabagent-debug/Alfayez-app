// ==== شاشة تسجيل الدخول (محدثة) ====
function renderLoginScreen() {
    // إخفاء الهيدر والشريط السفلي
    $('#main-header').style.display = 'none';
    $('#bottom-nav').classList.add('hidden');
    
    // تغيير لون الخلفية مؤقتاً لشاشة الدخول
    document.body.style.background = 'linear-gradient(135deg, #0c2b21 0%, #1a4033 100%)';

    $('#main-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height: 85vh; text-align:center; padding:20px; position:relative; overflow:hidden;">
            
            <!-- دوائر جمالية في الخلفية -->
            <div style="position:absolute; top:-50px; right:-50px; width:150px; height:150px; background:rgba(255,255,255,0.05); border-radius:50%;"></div>
            <div style="position:absolute; bottom:-30px; left:-30px; width:100px; height:100px; background:rgba(255,255,255,0.05); border-radius:50%;"></div>

            <div style="background: #fff; padding: 30px 20px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 100%; max-width: 350px; position:relative; z-index:1;">
                
                <img src="logo.jpg" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid #f3f4f6; margin-bottom:20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                
                <h2 style="color: #0c2b21; font-size: 1.6rem; margin-bottom: 5px; font-weight: 800;">الفايز للزيوت</h2>
                <p style="color: #8e8e93; font-size: 0.9rem; margin-bottom: 30px;">نظام إدارة الفروع المتكامل</p>
                
                <button class="btn" style="background: #fff; color: #333; border: 1px solid #ddd; display:flex; justify-content:center; gap:10px; align-items:center; padding:14px; font-size:1rem; font-weight: 700; border-radius:12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);" onclick="signInWithGoogle()">
                    الدخول بحساب جوجل
                </button>

                <div style="margin-top: 25px; font-size: 0.8rem; color: #aaa;">
                    الإصدار 1.0
                </div>
            </div>
        </div>
    `;
}
