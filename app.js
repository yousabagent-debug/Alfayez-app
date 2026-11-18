// ==== دوال الإشعارات الآمنة للتطبيق العام ====

async function updateNotificationBadge() {
    try {
        if (typeof supabaseClient === 'undefined') return;
        
        let { count, error } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true });

        if (error) return;

        const bellBtns = document.querySelectorAll('button[onclick*="openNotificationsModal"], .fa-bell, [onclick*="openNotificationsModal"], .notification-bell'); 

        bellBtns.forEach(bellBtn => {
            let badge = bellBtn.querySelector('.notif-badge');
            
            if (window.notificationsRead) {
                if (badge) badge.style.display = 'none';
                return;
            }

            if (!badge && count > 0) {
                badge = document.createElement('span');
                badge.className = 'notif-badge';
                badge.style.cssText = "position:absolute; top:-5px; right:-5px; background:var(--danger, #ff4757); color:white; border-radius:50%; padding:2px 6px; font-size:0.7rem; font-weight:bold;";
                bellBtn.style.position = 'relative';
                bellBtn.appendChild(badge);
            }
            if (badge) {
                if (count > 0) {
                    badge.innerText = count > 99 ? '99+' : count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    } catch (e) {
        console.log('تنبيه الإشعارات:', e);
    }
}

async function openNotificationsModal() {
    try {
        window.notificationsRead = true;
        const bellBtns = document.querySelectorAll('button[onclick*="openNotificationsModal"], .fa-bell, [onclick*="openNotificationsModal"], .notification-bell');
        bellBtns.forEach(bellBtn => {
            let badge = bellBtn.querySelector('.notif-badge');
            if (badge) badge.style.display = 'none';
        });

        if (typeof supabaseClient === 'undefined') return;

        let { data: notifs, error } = await supabaseClient
            .from('notifications')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);

        if (error) throw error;

        let notifHtml = notifs && notifs.length > 0 
            ? notifs.map(n => `
                <div style="padding: 10px; border-bottom: 1px solid var(--border); text-align: right;">
                    <div style="font-weight: bold; color: var(--primary);">${n.title || 'إشعار جديد'}</div>
                    <div style="font-size: 0.9rem; color: var(--text-main); margin-top: 3px;">${n.message}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px;">${n.created_at ? new Date(n.created_at).toLocaleString('ar-EG') : ''}</div>
                </div>
              `).join('')
            : '<p style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد إشعارات حالياً</p>';

        const existingModal = document.getElementById('notif-modal-overlay');
        if (existingModal) existingModal.remove();

        let modalBg = document.createElement('div');
        modalBg.id = 'notif-modal-overlay';
        modalBg.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;";
        
        modalBg.onclick = function(e) {
            if (e.target === modalBg) modalBg.remove();
        };

        modalBg.innerHTML = `
            <div style="background:white; width:90%; max-width:400px; border-radius:12px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.2); max-height:80vh; overflow-y:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 style="margin:0; color:var(--primary);">🔔 الإشعارات والتنبيهات</h3>
                    <button onclick="document.getElementById('notif-modal-overlay').remove()" style="background:none; border:none; font-size:1.4rem; cursor:pointer; color:var(--danger); font-weight:bold;">✕</button>
                </div>
                <div>${notifHtml}</div>
            </div>
        `;
        document.body.appendChild(modalBg);

    } catch (err) {
        console.log(err);
    }
}

// تشغيل خفيف بعد تحميل الصفحة بالكامل لضمان عدم توقف الـ Splash
window.addEventListener('load', () => {
    setTimeout(() => {
        window.notificationsRead = false;
        updateNotificationBadge();
    }, 2000);
});
