const SUPABASE_URL = 'https://dbmdovcnltehviliobdy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZLPavNoDjlUghIkBWrLFlg_KU2AFkBl';

let supabaseClient = null;

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
document.head.appendChild(script);

script.onload = () => {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase Ready');
};

async function getAll(table) {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from(table).select('*').order('id', { ascending: true });
    if (error) { console.error(error); return []; }
    return data || [];
}

async function getById(table, id) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from(table).select('*').eq('id', id).single();
    if (error) return null;
    return data;
}

async function addItem(table, item) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from(table).insert([item]).select();
    if (error) { console.error(error); return null; }
    return data[0];
}

async function updateItem(table, item) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from(table).update(item).eq('id', item.id);
    if (error) console.error(error);
}

async function deleteItem(table, id) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from(table).delete().eq('id', id);
    if (error) console.error(error);
}

async function signInWithGoogle() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) alert(error.message);
}

async function signOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.reload();
}

async function getCurrentUser() {
    if (!supabaseClient) return null;
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

async function getUserProfile(userId) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
    if (error) return null;
    return data;
}
