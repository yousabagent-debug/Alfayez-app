// ==== شاشة تسجيل الدخول ====
function renderLoginScreen() {
    // إخفاء الهيدر والشريط السفلي
    $('#main-header').style.display = 'none';
    $('#bottom-nav').classList.add('hidden');
    
    $('#main-content').innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:80vh; text-align:center; padding:20px;">
            <img src="logo.jpg" style="width:120px; height:120px; border-radius:50%; margin-bottom:30px; border:3px solid var(--primary); object-fit:cover;">
            <h2 style="margin-bottom:10px; color: var(--primary);">مرحباً بك في الفايز</h2>
            <p style="color:var(--text-muted); margin-bottom:40px;">سجل دخولك بحساب جوجل للبدء</p>
            
            <button class="btn btn-primary" style="display:flex; justify-content:center; gap:10px; align-items:center; padding:15px 30px; font-size:1.1rem; width:100%; max-width:300px;" onclick="signInWithGoogle()">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" width="24">
                تسجيل الدخول بجوجل
            </button>
        </div>
    `;
}
