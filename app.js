const members = [
  { name: 'Dad', emoji: '👨', role: 'Family Admin' },
  { name: 'Mom', emoji: '👩', role: 'Meal Planner' },
  { name: 'Son', emoji: '👦', role: 'Food Explorer' },
  { name: 'Daughter', emoji: '👧', role: 'Snack Boss' },
  { name: 'Grandma', emoji: '👵', role: 'Family Chef' },
  { name: 'Add Member', emoji: '➕', role: 'Invite family' }
];

let currentMember = members[0];

function initProfiles() {
  const container = document.getElementById('profiles');
  container.innerHTML = members.map((m, index) => `
    <button class="profile-card" onclick="selectMember(${index})">
      <div class="avatar">${m.emoji}</div>
      <b>${m.name}</b>
      <small>${m.role}</small>
    </button>
  `).join('');
}

function selectMember(index) {
  currentMember = members[index];
  if (currentMember.name === 'Add Member') {
    alert('Add Member will connect to Supabase later. For now, use the demo profiles.');
    return;
  }
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('greeting').textContent = `${getGreeting()}, ${currentMember.name} 👋`;
  document.getElementById('memberBadge').textContent = currentMember.emoji;
  showPanel('home');
}

function quickEnter(panel) {
  selectMember(0);
  showPanel(panel);
}

function backHome() {
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('landing').classList.remove('hidden');
}

function showPanel(panelName) {
  if (document.getElementById('dashboard').classList.contains('hidden')) {
    selectMember(0);
  }
  document.querySelectorAll('.panel').forEach(panel => panel.classList.remove('active-panel'));
  const panel = document.getElementById(`panel-${panelName}`);
  if (panel) panel.classList.add('active-panel');
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function saveMeal(event) {
  event.preventDefault();
  const food = document.getElementById('foodName').value.trim();
  const restaurant = document.getElementById('restaurantName').value.trim() || 'No restaurant saved';
  const location = document.getElementById('locationName').value.trim() || 'No location saved';
  const price = document.getElementById('price').value || '0';
  const calories = document.getElementById('calories').value || 'Unknown';
  const notes = document.getElementById('notes').value.trim() || 'No notes';

  const saved = document.getElementById('savedMeal');
  saved.classList.remove('hidden');
  saved.innerHTML = `
    <b>Saved for ${currentMember.name}</b>
    <p>🍽️ ${food}</p>
    <p>🏪 ${restaurant}</p>
    <p>📍 ${location}</p>
    <p>💵 ${price}</p>
    <p>🔥 ${calories} calories</p>
    <p>📝 ${notes}</p>
  `;

  const recentMeals = document.getElementById('recentMeals');
  recentMeals.insertAdjacentHTML('afterbegin', `
    <article><span>🍽️</span><b>${food}</b><p>${restaurant} · ${calories} calories</p></article>
  `);
  event.target.reset();
}

function sendChat() {
  const input = document.getElementById('chatText');
  const text = input.value.trim();
  if (!text) return;
  const chatBox = document.getElementById('chatBox');
  chatBox.insertAdjacentHTML('beforeend', `<p><b>${currentMember.name}:</b> ${escapeHtml(text)}</p>`);
  input.value = '';
  chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[char]));
}

initProfiles();
