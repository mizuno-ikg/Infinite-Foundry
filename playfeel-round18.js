'use strict';
(()=>{
  const style=document.createElement('style');
  style.dataset.playfeelRound18='toast-safe-zone';
  style.textContent=`
    .toast-stack{top:118px}
    @media(max-width:1100px){.toast-stack{top:152px}}
    @media(max-width:620px){.toast-stack{top:184px;right:8px;width:min(340px,calc(100vw - 16px))}}
  `;
  document.head.append(style);
  const m10Logic=document.createElement('script');m10Logic.src='balance-m10-logic.js';m10Logic.onload=()=>{const m10=document.createElement('script');m10.src='balance-m10.js';document.head.append(m10)};document.head.append(m10Logic);
})();
