// كود تجريبي للتأكد من أن التطبيق يشتغل
console.log("App.js loaded");

async function initSplash() {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('main-content').innerHTML = '<h2 style="text-align:center; margin-top:50px;">التطبيق شغال!</h2>';
    document.getElementById('branch-name').innerText = "تجربة";
}

window.onload = () => {
    initSplash();
};
