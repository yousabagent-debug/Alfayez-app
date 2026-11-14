// ==== شاشة اختيار الفروع ====
async function renderBranches() {
    // إظهار الهيدر
    $('#main-header').style.display = 'flex';
    
    // جلب الفروع من قاعدة البيانات
    const branches = await getAll('branches');
    
    // تغيير اسم الفرع في الهيدر
    $('#branch-name').innerText = "اختيار الفرع";

    $('#main-content').innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <img src="logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:15px; border: 2px solid var(--primary);">
            <h2>حدد فرعك</h2>
            <p style="color:var(--text-muted); font-size:0.9rem;">كل فرع له بضاعته ووردياته وحساباته</p>
        </div>
        <div id="branchesList"></div>
        ${state.userProfile && state.userProfile.role === 'admin' ? `<button class="btn btn-outline" style="border-style: dashed; border-width: 2px; margin-top:10px;" onclick="addBranchPrompt()">+ إضافة فرع جديد</button>` : ''}
        <div style="text-align:center; margin-top:30px; font-size:0.85rem; color:var(--text-muted);">${branches.length} من 10 فروع</div>
    `;
    
    // إخفاء الشريط السفلي
    $('#bottom-nav').classList.add('hidden');

    const list = $('#branchesList');
    branches.forEach((b, index) => {
        const card = createEl('div', 'branch-card', `
            <div class="right"><div class="icon-box">${index + 1}</div><div class="details"><h3>${b.name}</h3></div></div>
            <span style="color:var(--text-muted);">🔑</span>
        `);
        
        // عند الضغط على الفرع ندخل عليه
        card.onclick = () => loginBranch(b);
        
        // ضغطة طويلة لتعديل الفرع (للمدير)
        let pressTimer;
        card.onmousedown = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.onmouseup = () => clearTimeout(pressTimer);
        card.ontouchstart = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.ontouchend = () => clearTimeout(pressTimer);
        
        list.appendChild(card);
    });
}

// دالة الدخول للفرع
function loginBranch(branch) { 
    state.currentBranch = branch; 
    $('#branch-name').innerText = branch.name; 
    // هنا هننقل لواجهة التطبيق (هنعملها بعدين)
    navigate('dashboard'); 
}

// دالة إضافة فرع
async function addBranchPrompt() { 
    const name = prompt('اسم الفرع الجديد:'); 
    if (name) { 
        await addItem('branches', { name }); 
        renderBranches(); 
    } 
}

// دالة تعديل الفرع
async function editBranch(branch) { 
    const newName = prompt('الاسم الجديد:', branch.name); 
    if (newName && newName !== branch.name) { 
        branch.name = newName; 
        await updateItem('branches', branch); 
        renderBranches(); 
    } 
}
