import { login, getSession } from './supabase-client.js';

export function requireLogin() {
  return new Promise(async (resolve) => {
    let session = await getSession();
    if (session) { resolve(session); return; }

    const overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.innerHTML = `
      <div class="login-box">
        <h2>사랑이의 Reading Expert</h2>
        <p>아이디와 비밀번호를 입력해줘</p>
        <input id="login-id" type="text" placeholder="아이디" autocomplete="username">
        <input id="login-pw" type="password" placeholder="비밀번호" autocomplete="current-password">
        <button id="login-btn">로그인</button>
        <p id="login-error" class="login-error"></p>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `
      #login-overlay{position:fixed;inset:0;background:rgba(30,21,34,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;}
      #login-overlay .login-box{background:var(--paper,#fff);border-radius:20px;padding:28px 24px;max-width:320px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.25);}
      #login-overlay h2{font-family:"Jua","Noto Sans KR",sans-serif;font-size:22px;color:var(--plum,#5B2A6B);margin:0 0 6px;}
      #login-overlay p{color:var(--muted,#7A6A82);font-size:14px;margin:0 0 16px;}
      #login-overlay input{display:block;width:100%;box-sizing:border-box;padding:10px 14px;margin-bottom:10px;border-radius:12px;border:2px solid var(--line,#E9DCE6);font-size:15px;}
      #login-overlay button{width:100%;padding:11px;border:0;border-radius:99px;background:var(--plum,#5B2A6B);color:#fff;font-family:"Jua",sans-serif;font-size:16px;cursor:pointer;}
      #login-overlay button:disabled{opacity:.6;cursor:default;}
      #login-overlay .login-error{color:var(--wrong,#E24B4B);font-size:13px;min-height:18px;margin:10px 0 0;}
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const idInput = overlay.querySelector('#login-id');
    const pwInput = overlay.querySelector('#login-pw');
    const btn = overlay.querySelector('#login-btn');
    const errEl = overlay.querySelector('#login-error');

    async function attempt() {
      errEl.textContent = '';
      btn.disabled = true; btn.textContent = '로그인 중...';
      try {
        session = await login(idInput.value, pwInput.value);
        overlay.remove(); style.remove();
        resolve(session);
      } catch (e) {
        errEl.textContent = '아이디 또는 비밀번호가 올바르지 않아요.';
        btn.disabled = false; btn.textContent = '로그인';
      }
    }
    btn.addEventListener('click', attempt);
    pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    idInput.addEventListener('keydown', e => { if (e.key === 'Enter') pwInput.focus(); });
    idInput.focus();
  });
}
