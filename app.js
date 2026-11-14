console.log("App.js loaded");

window.onload = function() {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('main-content').innerHTML = '<h1 style="text-align:center; color: blue; margin-top: 50px;">التطبيق شغال تمام!</h1>';
};
