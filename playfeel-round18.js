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
})();
