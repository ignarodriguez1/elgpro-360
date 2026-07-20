// Contrato compartido entre el pre-script bloqueante (en el layout público) y el
// componente <Intro> (client). Vive en un solo lugar para que la clave de sesión
// no se pueda desincronizar entre quien la LEE (pre-script) y quien la ESCRIBE
// (Intro, al terminar la animación).

// La intro de marca se muestra una vez por sesión: esta es su marca en sessionStorage.
export const INTRO_SEEN_KEY = "elg-intro-seen";

// Pre-script bloqueante: corre en el PARSE del HTML, antes de la hidratación y
// antes de que se pinte el overlay. Por eso va como <script> inline en un Server
// Component (el layout), NO dentro de <Intro> (client): React no ejecuta un
// <script> renderizado en el cliente, y ahí disparaba el warning.
//
// Decide una de dos cosas y sale:
//  - Si la intro ya se vio esta sesión, o hay prefers-reduced-motion → marca
//    <html> con .intro-skip. El CSS (public.css) oculta el overlay sin flash.
//  - Si va a correr → setea window.__elgIntro=1, flag JS robusto (React no lo
//    resetea al hidratar, a diferencia de una clase) que RevealRoot lee para
//    retener el hero hasta el evento "elg:intro-done".
export const INTRO_PRE_SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem('${INTRO_SEEN_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('intro-skip')}else{window.__elgIntro=1}}catch(e){}`;
