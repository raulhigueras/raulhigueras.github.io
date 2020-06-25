var LAMP = document.getElementById('lamp');
var BODY = document.getElementById('body');

var i = 0

LAMP.onclick = () => {
  BODY.classList.add(i%2==0 ? "light":"dark");
  BODY.classList.remove(i%2==0 ? "dark":"light");
  i++;
}
