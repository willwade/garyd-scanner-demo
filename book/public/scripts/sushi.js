export function initSushiDemo() {
  const root = document.querySelector('.sushi-demo');
  if (!root) return;

  const beltContainer = root.querySelector('.sushi-belt-items');
  const restaurant = root.querySelector('.sushi-restaurant');
  const scoreDisplay = root.querySelector('.sushi-score');
  const speedInput = root.querySelector('.sushi-speed');
  const speedDisplay = root.querySelector('.sushi-speed-display');
  const tutorial = root.querySelector('.sushi-tutorial');
  const startBtn = root.querySelector('.sushi-start');
  const resetBtn = root.querySelector('.sushi-reset');
  const chaosBtn = root.querySelector('.sushi-chaos');

  if (!beltContainer || !restaurant || !scoreDisplay || !speedInput || !speedDisplay || !tutorial || !startBtn) return;

  const menu = ['🍣', '🍤', '🍙', '🥟', '🍱', '🍵', '🍥', '🥢', '🍛', '🥗'];
  let items = [];
  let score = 0;
  let baseSpeed = 2;
  let isPlaying = false;
  let beltWidth = restaurant.clientWidth;
  const itemGap = 130;

  startBtn.addEventListener('click', () => {
    tutorial.style.display = 'none';
    isPlaying = true;
    animate();
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      score = 0;
      updateScore(0);
      resetSpeed();
    });
  }

  if (chaosBtn) {
    chaosBtn.addEventListener('click', () => {
      speedInput.value = 25;
      restaurant.style.transform = 'translateX(5px)';
      setTimeout(() => (restaurant.style.transform = 'translateX(-5px)'), 50);
      setTimeout(() => (restaurant.style.transform = 'translateX(0px)'), 100);
    });
  }

  function init() {
    beltContainer.innerHTML = '';
    items = [];
    score = 0;
    updateScore(0);
    resetSpeed();

    beltWidth = restaurant.clientWidth;
    const count = Math.ceil(beltWidth / itemGap) + 3;

    for (let i = 0; i < count; i++) {
      createItem(i * itemGap);
    }
  }

  function createItem(xPos) {
    const div = document.createElement('div');
    div.classList.add('sushi-plate');
    div.innerText = menu[Math.floor(Math.random() * menu.length)];
    div.style.transform = `translateX(${xPos}px)`;

    const itemObj = {
      element: div,
      x: xPos,
      grabbed: false,
      type: div.innerText
    };

    div.addEventListener('mousedown', (e) => tryGrab(e, itemObj));
    div.addEventListener('touchstart', (e) => {
      e.preventDefault();
      tryGrab(e.touches[0], itemObj);
    }, { passive: false });

    beltContainer.appendChild(div);
    items.push(itemObj);
  }

  function animate() {
    if (!isPlaying) return;

    baseSpeed = parseFloat(speedInput.value);
    speedDisplay.textContent = baseSpeed.toFixed(1);

    items.forEach((item) => {
      if (!item.grabbed) {
        item.x += baseSpeed;
        if (item.x > beltWidth + 50) {
          item.x = -100;
          recycleItem(item);
        }
        item.element.style.transform = `translateX(${item.x}px)`;
      }
    });

    requestAnimationFrame(animate);
  }

  function recycleItem(item) {
    item.element.innerText = menu[Math.floor(Math.random() * menu.length)];
    item.element.style.opacity = '1';
    item.element.style.pointerEvents = 'auto';
    item.grabbed = false;
  }

  function tryGrab(e, item) {
    if (!isPlaying || item.grabbed) return;

    const zone = root.querySelector('.sushi-reach-zone').getBoundingClientRect();
    const restaurantRect = restaurant.getBoundingClientRect();
    const itemCenter = item.x + 35;
    const zoneLeft = zone.left - restaurantRect.left;
    const zoneRight = zone.right - restaurantRect.left;

    if (itemCenter >= zoneLeft && itemCenter <= zoneRight) {
      item.grabbed = true;
      updateScore(score + 1);
      increaseSpeed();
      showFloatingText(e.clientX, e.clientY, 'Tasty!', '#00b894');
      item.element.style.opacity = '0';
      item.element.style.pointerEvents = 'none';
      setTimeout(() => {
        item.x = -150;
        recycleItem(item);
      }, 200);
    } else {
      showFloatingText(e.clientX, e.clientY, 'Missed!', '#d63031');
    }
  }

  function increaseSpeed() {
    const current = parseFloat(speedInput.value);
    const max = parseFloat(speedInput.max);
    const increment = current < 15 ? 1.5 : 0.5;
    if (current < max) {
      speedInput.value = current + increment;
      speedDisplay.style.color = '#fdcb6e';
      setTimeout(() => (speedDisplay.style.color = '#d63031'), 300);
    }
  }

  function updateScore(newScore) {
    score = newScore;
    scoreDisplay.textContent = `${score}`;
  }

  function resetSpeed() {
    speedInput.value = 2;
  }

  function showFloatingText(x, y, text, color) {
    const el = document.createElement('div');
    el.classList.add('sushi-floater');
    el.textContent = text;
    if (color) el.style.color = color;

    const rect = restaurant.getBoundingClientRect();
    const localX = x ? x - rect.left : rect.width / 2;
    const localY = y ? y - rect.top : rect.height / 2;

    el.style.left = `${localX}px`;
    el.style.top = `${localY}px`;

    restaurant.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  window.addEventListener('resize', () => {
    beltWidth = restaurant.clientWidth;
  });

  init();
}
