// ==== شاشة اختيار الفروع ====
async function renderBranches() {
    document.body.style.background = '#f9f9f9';
    $('#main-header').style.display = 'flex';
    
    const branches = await getAll('branches');
    $('#branch-name').innerText = t('branches');

    $('#main-content').innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <img src="logo.jpg" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:15px; border: 2px solid var(--primary);">
            <h2>${t('selectBranch')}</h2>
            <p style="color:var(--text-muted); font-size:0.9rem;">${t('selectBranchDesc')}</p>
        </div>
        <div id="branchesList"></div>
        ${state.userProfile && state.userProfile.role === 'admin' ? `<button class="btn btn-outline" style="border-style: dashed; border-width: 2px; margin-top:10px;" onclick="addBranchPrompt()">${t('addBranch')}</button>` : ''}
        <div style="text-align:center; margin-top:30px; font-size:0.85rem; color:var(--text-muted);">${branches.length} ${t('branchesCount')}</div>
    `;
    
    $('#bottom-nav').classList.add('hidden');

    const list = $('#branchesList');
    branches.forEach((b, index) => {
        const card = createEl('div', 'branch-card', `
            <div class="right"><div class="icon-box">${index + 1}</div><div class="details"><h3>${b.name}</h3></div></div>
            <span style="color:var(--text-muted);">🔑</span>
        `);
        card.onclick = () => loginBranch(b);
        let pressTimer;
        card.onmousedown = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.onmouseup = () => clearTimeout(pressTimer);
        card.ontouchstart = () => { pressTimer = setTimeout(() => editBranch(b), 800); };
        card.ontouchend = () => clearTimeout(pressTimer);
        list.appendChild(card);
    });
}

function loginBranch(branch) { 
    state.currentBranch = branch; 
    $('#branch-name').innerText = branch.name; 
    navigate('dashboard'); 
}

async function addBranchPrompt() { 
    const name = prompt(t('addBranch'));
    if (name) { 
        await addItem('branches', { name }); 
        renderBranches(); 
    } 
}

async function editBranch(branch) { 
    const newName = prompt('الاسم الجديد:', branch.name); 
    if (newName && newName !== branch.name) { 
        branch.name = newName; 
        await updateItem('branches', branch); 
        renderBranches(); 
    } 
}
