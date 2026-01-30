/* ================================
   حماية + نظام حساب كامل
   ختت × GASTS
================================ */

// فلترة المدخلات لمنع XSS و HTML Injection
function clean(input) {
    return input.replace(/[<>"'(){};]/g, "").trim();
}

/* ================================
   1) تسجيل الدخول + تسجيل جديد
================================ */
async function loginOrSignup(email, password) {

    email = clean(email);
    password = clean(password);

    if (!email || !password) return { error: "empty" };

    // محاولة تسجيل الدخول
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    // إذا الحساب غير موجود → نسوي تسجيل جديد
    if (error) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) return { error: signUpError.message };

        // تسجيل دخول بعد إنشاء الحساب
        await supabase.auth.signInWithPassword({ email, password });
    }

    return { success: true };
}

/* ================================
   2) تسجيل خروج
================================ */
async function logout() {
    await supabase.auth.signOut();
    window.location.href = "index.html";
}

/* ================================
   3) حماية الصفحات (account + settings)
================================ */
async function protectPage() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
        window.location.href = "index.html";
    }
}

/* ================================
   4) جلب بيانات المستخدم
================================ */
async function getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
}

/* ================================
   5) تحديث البريد
================================ */
async function updateEmail(newEmail) {
    newEmail = clean(newEmail);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    return error ? error.message : "success";
}

/* ================================
   6) تحديث كلمة المرور
================================ */
async function updatePassword(newPass) {
    newPass = clean(newPass);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    return error ? error.message : "success";
}

/* ================================
   7) حذف الحساب نهائياً
================================ */
async function deleteAccount() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    // Supabase لا يسمح بحذف الحساب من الواجهة مباشرة
    // نحتاج REST API أو RLS
    alert("حذف الحساب يحتاج API Key خاصة. سأجهزها لك إذا رغبت.");
}

/* ================================
   8) تشغيل النظام حسب الصفحة
================================ */
document.addEventListener("DOMContentLoaded", async () => {

    const path = window.location.pathname;

    /* ========== index.html ========== */
    if (path.includes("index")) {

        const authBtn = document.getElementById("authBtn");
        const authModal = document.getElementById("authModal");
        const loginBtn = document.getElementById("loginBtn");
        const authBox = document.getElementById("authBox");

        // فتح المودال
        authBtn.onclick = () => authModal.style.display = "flex";

        // إغلاق عند الضغط خارج الصندوق
        authModal.onclick = (e) => {
            if (e.target === authModal) authModal.style.display = "none";
        };

        // تسجيل الدخول
        loginBtn.onclick = async () => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const result = await loginOrSignup(email, password);

            if (result.error) {
                authBox.classList.add("shake");
                setTimeout(() => authBox.classList.remove("shake"), 300);
                return;
            }

            authModal.style.display = "none";
            window.location.href = "account.html";
        };

        // دعم زر Enter
        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && authModal.style.display === "flex") {
                loginBtn.click();
            }
        });
    }

    /* ========== account.html ========== */
    if (path.includes("account")) {

        await protectPage();

        const user = await getUser();
        const userInfo = document.getElementById("userInfo");
        const logoutBtn = document.getElementById("logoutBtn");

        userInfo.innerHTML = `
            <p><strong>البريد:</strong> ${user.email}</p>
            <p><strong>المعرف:</strong> ${user.id}</p>
        `;

        logoutBtn.onclick = logout;
    }

    /* ========== settings.html ========== */
    if (path.includes("settings")) {

        await protectPage();

        const updateEmailBtn = document.getElementById("updateEmailBtn");
        const updatePassBtn = document.getElementById("updatePassBtn");
        const deleteAccountBtn = document.getElementById("deleteAccountBtn");

        updateEmailBtn.onclick = async () => {
            const newEmail = document.getElementById("newEmail").value;
            const result = await updateEmail(newEmail);
            alert(result === "success" ? "تم تحديث البريد" : result);
        };

        updatePassBtn.onclick = async () => {
            const newPass = document.getElementById("newPass").value;
            const result = await updatePassword(newPass);
            alert(result === "success" ? "تم تحديث كلمة المرور" : result);
        };

        deleteAccountBtn.onclick = () => {
            alert("حذف الحساب يحتاج API خاصة. أقدر أجهزها لك.");
        };
    }

});
