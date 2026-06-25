const appState = {
  familyId: null,
  currentMember: null,
  currentPage: 'dashboard',
  members: [
    { id: 'dad', name: 'Dad', avatar: '👨', role: 'Family Admin', photo: 'https://api.dicebear.com/9.x/adventurer/svg?seed=dad&backgroundColor=d1d4f9' },
    { id: 'mom', name: 'Mom', avatar: '👩', role: 'Meal Planner', photo: 'https://api.dicebear.com/9.x/adventurer/svg?seed=mom&backgroundColor=ffd5dc' },
    { id: 'daughter', name: 'Emily', avatar: '👧', role: 'Snack Curator', photo: 'https://api.dicebear.com/9.x/adventurer/svg?seed=emily&backgroundColor=ffe7a3' },
    { id: 'son', name: 'James', avatar: '👦', role: 'Food Explorer', photo: 'https://api.dicebear.com/9.x/adventurer/svg?seed=james&backgroundColor=d8f0c8' },
    { id: 'grandma', name: 'Sophia', avatar: '👵', role: 'Family Chef', photo: 'https://api.dicebear.com/9.x/adventurer/svg?seed=sophia&backgroundColor=e9daf6' },
    { id: 'add', name: 'Add Member', avatar: '＋', role: 'Invite family' }
  ],
  meals: [
    {
      id: 'seed-1',
      member_id: 'dad',
      food_name: 'Salmon rice bowl',
      restaurant_name: 'Kitchen Table',
      location_name: 'Home',
      price: 12,
      calories: 620,
      notes: 'Good protein and vegetables.',
      eaten_at: new Date().toISOString()
    },
    {
      id: 'seed-2',
      member_id: 'dad',
      food_name: 'Mango yogurt',
      restaurant_name: 'Family Fridge',
      location_name: 'Home',
      price: 4,
      calories: 240,
      notes: 'Easy afternoon snack.',
      eaten_at: new Date().toISOString()
    }
  ],
  favorites: [
    { id: 'fav-1', name: 'Grandma Kitchen', phone: 'Add number', address: 'Near home', notes: 'Comfort food for Sunday dinner.' },
    { id: 'fav-2', name: 'Pizza Company', phone: '1112', address: 'Delivery', notes: 'Fast Friday-night order.' },
    { id: 'fav-3', name: 'Sushi Family Bar', phone: 'Add number', address: 'City center', notes: 'Daughter always votes for salmon rolls.' }
  ],
  chat: [
    { id: 'chat-1', member_id: 'mom', member_name: 'Mom', message: 'Who is home for dinner?', created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 'chat-2', member_id: 'dad', member_name: 'Dad', message: 'I can order if everyone chooses by 6.', created_at: new Date(Date.now() - 900000).toISOString() },
    { id: 'chat-3', member_id: 'daughter', member_name: 'Daughter', message: 'Sushi please.', created_at: new Date(Date.now() - 600000).toISOString() }
  ],
  chefOrders: [],
  voiceNotes: []
};

const profilePhotoStorageKey = 'familyBites.profilePhotos';
const localMealsStorageKey = 'familyBites.meals';
const localChatStorageKey = 'familyBites.chat';
const chefOrdersStorageKey = 'familyBites.chefOrders';
const chefVoiceStorageKey = 'familyBites.chefVoiceNotes';

const avatarOptions = [
  { seed: 'dad', color: 'd1d4f9' },
  { seed: 'mom', color: 'ffd5dc' },
  { seed: 'emily', color: 'ffe7a3' },
  { seed: 'james', color: 'd8f0c8' },
  { seed: 'sophia', color: 'e9daf6' },
  { seed: 'chef', color: 'ffdfbf' },
  { seed: 'smile', color: 'd6f5ec' },
  { seed: 'sunny', color: 'fff0a8' },
  { seed: 'noodle', color: 'f6d6ff' },
  { seed: 'bento', color: 'cfe8ff' }
];

const menuItems = [
  { id: 'lemon-chicken', name: 'Lemon Garlic Chicken', detail: 'Roasted veggies, family portion', emoji: '🍗' },
  { id: 'salmon-rice', name: 'Salmon Rice Bowl', detail: 'Protein bowl with greens', emoji: '🍣' },
  { id: 'spaghetti', name: 'Spaghetti Bolognese', detail: 'Classic red sauce pasta', emoji: '🍝' },
  { id: 'tacos', name: 'Tacos Night', detail: 'Chicken, salsa, and salad', emoji: '🌮' },
  { id: 'pizza', name: 'Homemade Pizza', detail: 'Cheese, tomato, basil', emoji: '🍕' },
  { id: 'brunch', name: 'Family Brunch', detail: 'Pancakes, fruit, and eggs', emoji: '🥞' }
];

let voiceRecorder = null;
let voiceChunks = [];

const navItems = [
  { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { page: 'snap', icon: '📷', label: 'Snap Food' },
  { page: 'favorites', icon: '❤️', label: 'Favorites' },
  { page: 'weekly', icon: '📊', label: 'Weekly Report' },
  { page: 'chat', icon: '💬', label: 'Family Chat' },
  { page: 'chef', icon: '🧑‍🍳', label: 'Chef' },
  { page: 'timeline', icon: '📅', label: 'Timeline' },
  { page: 'profile', icon: '👤', label: 'Profile' }
];

const mobileItems = navItems.filter((item) => ['dashboard', 'snap', 'favorites', 'weekly', 'chat'].includes(item.page));

document.addEventListener('DOMContentLoaded', () => {
  applyStoredAppData();
  applyStoredProfilePhotos();
  renderProfiles();
  renderNavigation();
  bindEvents();
  hydrateFromSupabase();
});

function bindEvents() {
  document.body.addEventListener('click', (event) => {
    const pageTarget = event.target.closest('[data-page]');
    const actionTarget = event.target.closest('[data-action]');

    if (pageTarget) {
      showPage(pageTarget.dataset.page);
    }

    if (actionTarget) {
      handleAction(actionTarget.dataset.action);
    }

    const avatarTarget = event.target.closest('[data-avatar-url]');
    if (avatarTarget) {
      chooseProfileAvatar(avatarTarget.dataset.avatarUrl);
    }

    const orderTarget = event.target.closest('[data-send-order]');
    if (orderTarget) {
      sendOrderToChef(orderTarget.dataset.sendOrder);
    }

    const completeTarget = event.target.closest('[data-complete-order]');
    if (completeTarget) {
      completeChefOrder(completeTarget.dataset.completeOrder);
    }
  });

  document.getElementById('mealForm').addEventListener('submit', saveMeal);
  document.getElementById('chatForm').addEventListener('submit', sendChat);
  document.getElementById('mealPhoto').addEventListener('change', handlePhotoChange);
  document.getElementById('profilePhotoInput').addEventListener('change', handleProfilePhotoChange);
  document.getElementById('voiceRecordButton').addEventListener('click', toggleVoiceRecording);

  ['foodName', 'restaurantName', 'calories'].forEach((id) => {
    document.getElementById(id).addEventListener('input', updateMealPreview);
  });
}

async function hydrateFromSupabase() {
  if (!window.familyBitesDb?.isConfigured) {
    selectMember(appState.members[0], { openDashboard: false });
    return;
  }

  try {
    await window.familyBitesDb.ensureFamily();
    appState.familyId = window.familyBitesDb.familyId;
    const [members, meals, favorites, chat] = await Promise.all([
      window.familyBitesDb.getMembers(),
      window.familyBitesDb.getMeals(),
      window.familyBitesDb.getFavorites(),
      window.familyBitesDb.getChat()
    ]);

    if (members.length) {
      appState.members = [...members.map(normalizeMember), appState.members.find((member) => member.id === 'add')];
      applyStoredProfilePhotos();
    }
    if (meals.length) appState.meals = mergeRecords(meals.map(normalizeMeal), appState.meals);
    if (favorites.length) appState.favorites = favorites;
    if (chat.length) appState.chat = mergeRecords(chat.map(normalizeChat), appState.chat);
  } catch (error) {
    console.warn('Supabase unavailable, using local demo data.', error);
  }

  saveStoredAppData();

  renderProfiles();
  selectMember(appState.members[0], { openDashboard: false });
}

function renderProfiles() {
  const profileGrid = document.getElementById('profileGrid');
  profileGrid.innerHTML = appState.members.map((member) => `
    <button class="profile-card" type="button" data-member-id="${escapeAttr(member.id)}">
      <span class="avatar">${avatarMarkup(member)}</span>
      <strong>${escapeHtml(member.name)}</strong>
      <small>${escapeHtml(member.role || 'Family member')}</small>
    </button>
  `).join('');

  profileGrid.querySelectorAll('[data-member-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const member = appState.members.find((item) => item.id === button.dataset.memberId);
      selectMember(member);
    });
  });
}

function renderNavigation() {
  document.getElementById('desktopNav').innerHTML = navItems.map(navTemplate).join('');
  document.getElementById('mobileNav').innerHTML = mobileItems.map(navTemplate).join('');
}

function navTemplate(item) {
  return `
    <button class="nav-item" type="button" data-page="${item.page}">
      <span>${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `;
}

function selectMember(member, options = { openDashboard: true }) {
  if (!member) return;

  if (member.id === 'add' || member.name === 'Add Member') {
    alert('Add Member is ready for Supabase-backed invitations. For now, choose a demo profile.');
    return;
  }

  appState.currentMember = member;
  updateProfileUi();

  if (options.openDashboard) {
    document.getElementById('landing').classList.add('hidden');
    document.getElementById('workspace').classList.remove('hidden');
    showPage('dashboard');
  } else {
    renderAll();
  }
}

function handleAction(action) {
  if (action === 'home') {
    document.getElementById('workspace').classList.add('hidden');
    document.getElementById('landing').classList.remove('hidden');
  }

  if (action === 'demo-dashboard') {
    selectMember(appState.currentMember || appState.members[0]);
  }
}

function showPage(pageName) {
  if (!appState.currentMember) {
    selectMember(appState.members[0]);
  }

  appState.currentPage = pageName;
  document.querySelectorAll('.page').forEach((page) => page.classList.remove('active-page'));
  const page = document.getElementById(`page-${pageName}`);
  if (page) page.classList.add('active-page');

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });

  document.getElementById('pageTitle').textContent = page?.dataset.title || 'FamilyBites';
  document.getElementById('activeKicker').textContent = page?.dataset.kicker || 'FamilyBites';
  renderAll();
}

function renderAll() {
  renderDashboard();
  renderMeals();
  renderFavorites();
  renderOrderMenu();
  renderChefInterface();
  renderReport();
  renderChat();
  renderProfile();
  updateMealPreview();
}

function updateProfileUi() {
  const member = appState.currentMember;
  document.getElementById('navAvatar').innerHTML = avatarMarkup(member);
  document.getElementById('navName').textContent = member.name;
  document.getElementById('activeAvatar').innerHTML = `${avatarMarkup(member)} <span>${escapeHtml(member.name)}</span>`;
  document.getElementById('dashboardGreeting').textContent = `${getGreeting()}, ${member.name}`;
}

function renderDashboard() {
  const memberMeals = getMemberMeals();
  const todayMeals = memberMeals.filter(isToday);
  const calories = sum(todayMeals, 'calories');
  const spend = sum(todayMeals, 'price');
  const progress = Math.min(Math.round((calories / 2200) * 100), 100);

  document.getElementById('todayCalories').textContent = calories.toLocaleString();
  document.getElementById('todayMeals').textContent = todayMeals.length.toString();
  document.getElementById('todaySpend').textContent = formatMoney(spend);
  document.getElementById('calorieProgress').style.width = `${progress}%`;
  document.getElementById('mealSummary').textContent = todayMeals.length
    ? todayMeals.slice(0, 3).map((meal) => meal.food_name).join(', ')
    : 'No meals logged yet';
  document.getElementById('aiNudge').textContent = calories > 0
    ? `You have logged ${calories.toLocaleString()} calories today. Add one colorful side or fruit snack to lift the weekly balance.`
    : 'Add the first meal today and FamilyBites will start shaping a weekly pattern.';
}

function renderMeals() {
  const meals = getMemberMeals();
  const mealCards = meals.slice(0, 4).map(mealTemplate).join('') || emptyState('No meals yet. Snap your first food memory.');
  document.getElementById('recentMeals').innerHTML = mealCards;

  document.getElementById('timelineList').innerHTML = meals.map((meal) => `
    <article class="timeline-item">
      <span class="timeline-date">${formatDate(meal.eaten_at)}</span>
      <div>
        <h4>${escapeHtml(meal.food_name)}</h4>
        <p>${escapeHtml(meal.restaurant_name || 'Family meal')} · ${escapeHtml(meal.location_name || 'No location')}</p>
      </div>
      <strong>${Number(meal.calories || 0).toLocaleString()} cal</strong>
    </article>
  `).join('') || emptyState('Your food timeline will appear here.');
}

function mealTemplate(meal) {
  return `
    <article class="meal-card ${meal.photo_url ? 'has-photo' : ''}">
      <span class="meal-emoji">${mealEmoji(meal.food_name)}</span>
      ${meal.photo_url ? `<img class="meal-photo" src="${escapeAttr(meal.photo_url)}" alt="${escapeAttr(meal.food_name)}">` : ''}
      <div>
        <h4>${escapeHtml(meal.food_name)}</h4>
        <p>${escapeHtml(meal.restaurant_name || 'Family meal')} · ${escapeHtml(meal.notes || 'Saved to FamilyBites')}</p>
      </div>
      <strong>${Number(meal.calories || 0).toLocaleString()} cal</strong>
    </article>
  `;
}

function renderFavorites() {
  const cards = appState.favorites.map((restaurant) => `
    <article class="restaurant-card">
      <span class="restaurant-emoji">${restaurantEmoji(restaurant.name)}</span>
      <div>
        <h4>${escapeHtml(restaurant.name)}</h4>
        <p>${escapeHtml(restaurant.notes || restaurant.address || 'Family favorite')}</p>
        <p>${escapeHtml(restaurant.phone || 'Phone not saved')}</p>
      </div>
      <button type="button">Order Again</button>
    </article>
  `).join('');

  document.getElementById('favoriteGrid').innerHTML = cards;
}

function renderOrderMenu() {
  document.getElementById('orderGrid').innerHTML = menuItems.map((item) => `
    <article class="order-menu-card">
      <span>${item.emoji}</span>
      <div>
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(item.detail)}</p>
      </div>
      <button type="button" data-send-order="${escapeAttr(item.id)}">Send to Chef</button>
    </article>
  `).join('');
}

function renderChefInterface() {
  const activeOrders = appState.chefOrders.filter((order) => order.status !== 'done');
  document.getElementById('chefOrderList').innerHTML = activeOrders.map((order) => `
    <article class="chef-order-card">
      <span>${escapeHtml(order.emoji || '🍽️')}</span>
      <div>
        <h4>${escapeHtml(order.food_name)}</h4>
        <p>${escapeHtml(order.detail || 'Family order')}</p>
        <small>${escapeHtml(order.member_name || 'Family')} · ${formatDate(order.created_at)}</small>
      </div>
      <button type="button" data-complete-order="${escapeAttr(order.id)}">Done</button>
    </article>
  `).join('') || emptyChefState('No food orders sent yet.');

  document.getElementById('chefVoiceList').innerHTML = appState.voiceNotes.map((note) => `
    <article class="chef-voice-card">
      <div>
        <h4>${escapeHtml(note.member_name || 'Family')} voice note</h4>
        <small>${formatDate(note.created_at)}</small>
      </div>
      <audio controls src="${escapeAttr(note.audio_url)}"></audio>
    </article>
  `).join('') || emptyChefState('No voice notes yet.');
}

function sendOrderToChef(menuItemId) {
  const item = menuItems.find((entry) => entry.id === menuItemId);
  const member = appState.currentMember || appState.members[0];
  if (!item) return;

  appState.chefOrders.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}`,
    food_name: item.name,
    detail: item.detail,
    emoji: item.emoji,
    member_id: member.id,
    member_name: member.name,
    status: 'sent',
    created_at: new Date().toISOString()
  });
  saveStoredAppData();
  renderChefInterface();
  showPage('chef');
}

function completeChefOrder(orderId) {
  appState.chefOrders = appState.chefOrders.map((order) => (
    order.id === orderId ? { ...order, status: 'done' } : order
  ));
  saveStoredAppData();
  renderChefInterface();
}

async function toggleVoiceRecording() {
  const button = document.getElementById('voiceRecordButton');
  if (voiceRecorder?.state === 'recording') {
    voiceRecorder.stop();
    button.textContent = 'Record Voice';
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    alert('Voice recording is not supported in this browser.');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceChunks = [];
    voiceRecorder = new MediaRecorder(stream);
    voiceRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) voiceChunks.push(event.data);
    });
    voiceRecorder.addEventListener('stop', () => {
      stream.getTracks().forEach((track) => track.stop());
      saveVoiceNote(new Blob(voiceChunks, { type: voiceRecorder.mimeType || 'audio/webm' }));
    });
    voiceRecorder.start();
    button.textContent = 'Stop Recording';
  } catch (error) {
    console.warn('Microphone unavailable.', error);
    alert('Microphone access was blocked or unavailable.');
  }
}

function saveVoiceNote(blob) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const member = appState.currentMember || appState.members[0];
    appState.voiceNotes.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `voice-${Date.now()}`,
      member_id: member.id,
      member_name: member.name,
      audio_url: String(reader.result || ''),
      created_at: new Date().toISOString()
    });
    saveStoredAppData();
    renderChefInterface();
    showPage('chef');
  });
  reader.readAsDataURL(blob);
}

function renderReport() {
  const meals = getMemberMeals();
  const calories = sum(meals, 'calories');
  const spend = sum(meals, 'price');
  const favoriteRestaurant = mostCommon(meals.map((meal) => meal.restaurant_name).filter(Boolean));
  const favoriteFood = mostCommon(meals.map((meal) => meal.food_name).filter(Boolean));

  document.getElementById('reportMeals').textContent = meals.length.toString();
  document.getElementById('reportCalories').textContent = calories.toLocaleString();
  document.getElementById('reportSpend').textContent = formatMoney(spend);
  document.getElementById('reportRestaurant').textContent = favoriteRestaurant || '-';
  document.getElementById('reportFood').textContent = favoriteFood || '-';
  document.getElementById('weeklyRecommendation').textContent = meals.length
    ? `AI recommendation: ${appState.currentMember.name} is building a useful food history. Keep protein steady, add more fruit, and save restaurant prices to improve family spending insights.`
    : 'Log a few meals and the weekly AI report will summarize nutrition, habits, restaurants, and spending.';
}

function renderChat() {
  const member = appState.currentMember;
  document.getElementById('chatList').innerHTML = appState.chat.map((message) => {
    const isMine = message.member_id === member?.id || message.member_name === member?.name;
    return `
      <article class="chat-message ${isMine ? 'mine' : ''}">
        <strong>${escapeHtml(message.member_name || 'Family')}</strong>
        <span>${escapeHtml(message.message)}</span>
      </article>
    `;
  }).join('');
  const chatList = document.getElementById('chatList');
  chatList.scrollTop = chatList.scrollHeight;
}

function renderProfile() {
  const member = appState.currentMember || appState.members[0];
  document.getElementById('profileAvatarLarge').innerHTML = avatarMarkup(member);
  document.getElementById('profileNameLarge').textContent = member.name;
  document.getElementById('profileRoleLarge').textContent = member.role || 'Family member';
  renderAvatarPicker(member);
}

async function saveMeal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const photoUrl = document.getElementById('photoPreview').dataset.photoUrl || '';
  const meal = {
    id: crypto.randomUUID ? crypto.randomUUID() : `meal-${Date.now()}`,
    family_id: appState.familyId,
    member_id: appState.currentMember.id,
    food_name: formData.get('food_name').trim(),
    restaurant_name: formData.get('restaurant_name').trim(),
    location_name: formData.get('location_name').trim(),
    price: numberOrNull(formData.get('price')),
    calories: numberOrNull(formData.get('calories')),
    notes: formData.get('notes').trim(),
    photo_url: photoUrl,
    eaten_at: new Date().toISOString()
  };

  if (!meal.food_name) return;

  appState.meals.unshift(meal);
  saveStoredAppData();
  form.reset();
  resetPhotoPreview();
  showPage('dashboard');

  if (window.familyBitesDb?.isConfigured) {
    try {
      const savedMeal = await window.familyBitesDb.saveMeal(meal);
      appState.meals = appState.meals.map((item) => item.id === meal.id ? normalizeMeal(savedMeal) : item);
      saveStoredAppData();
      renderAll();
    } catch (error) {
      console.warn('Meal saved locally but Supabase write failed.', error);
    }
  }
}

async function sendChat(event) {
  event.preventDefault();
  const input = document.getElementById('chatText');
  const messageText = input.value.trim();
  if (!messageText) return;

  const message = {
    id: crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}`,
    family_id: appState.familyId,
    member_id: appState.currentMember.id,
    member_name: appState.currentMember.name,
    message: messageText,
    created_at: new Date().toISOString()
  };

  appState.chat.push(message);
  saveStoredAppData();
  input.value = '';
  renderChat();

  if (window.familyBitesDb?.isConfigured) {
    try {
      const savedMessage = await window.familyBitesDb.sendChat(message);
      appState.chat = appState.chat.map((item) => item.id === message.id ? normalizeChat(savedMessage) : item);
      saveStoredAppData();
      renderChat();
    } catch (error) {
      console.warn('Chat saved locally but Supabase write failed.', error);
    }
  }
}

function updateMealPreview() {
  const food = document.getElementById('foodName').value.trim();
  const restaurant = document.getElementById('restaurantName').value.trim();
  const calories = document.getElementById('calories').value.trim();
  const photoUrl = document.getElementById('photoPreview').dataset.photoUrl || '';
  const previewPhoto = document.getElementById('previewPhoto');
  document.getElementById('previewFood').textContent = food || 'New family bite';
  document.getElementById('previewMeta').textContent = [
    restaurant || 'Restaurant not set',
    calories ? `${calories} calories` : 'Calories pending'
  ].join(' · ');

  previewPhoto.classList.toggle('hidden', !photoUrl);
  if (photoUrl) previewPhoto.src = photoUrl;
}

async function handlePhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    resetPhotoPreview();
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    event.target.value = '';
    resetPhotoPreview();
    return;
  }

  try {
    const photoUrl = await resizeImageFile(file, 900, 0.82);
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.src = photoUrl;
    photoPreview.dataset.photoUrl = photoUrl;
    photoPreview.classList.remove('hidden');
    document.getElementById('photoIcon').classList.add('hidden');
    document.getElementById('photoTitle').textContent = 'Photo ready';
    document.getElementById('photoHint').textContent = 'Tap again to replace it.';
    updateMealPreview();
  } catch (error) {
    console.warn('Could not load food photo.', error);
    alert('Could not load that food photo. Please try another image.');
    event.target.value = '';
    resetPhotoPreview();
  }
}

function resetPhotoPreview() {
  const photoPreview = document.getElementById('photoPreview');
  const previewPhoto = document.getElementById('previewPhoto');
  photoPreview.removeAttribute('src');
  photoPreview.dataset.photoUrl = '';
  photoPreview.classList.add('hidden');
  previewPhoto.removeAttribute('src');
  previewPhoto.classList.add('hidden');
  document.getElementById('photoIcon').classList.remove('hidden');
  document.getElementById('photoTitle').textContent = 'Tap to snap or upload food';
  document.getElementById('photoHint').textContent = 'Your photo will appear in the meal preview.';
}

async function handleProfilePhotoChange(event) {
  const file = event.target.files?.[0];
  const member = appState.currentMember;
  if (!file || !member) return;

  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    event.target.value = '';
    return;
  }

  try {
    const photoUrl = await resizeImageFile(file, 640, 0.84);
    member.photo = photoUrl;
    const matchingMember = appState.members.find((item) => item.id === member.id);
    if (matchingMember) matchingMember.photo = photoUrl;
    saveProfilePhoto(member.id, photoUrl);
    renderProfiles();
    updateProfileUi();
    renderProfile();
    event.target.value = '';
  } catch (error) {
    console.warn('Could not read profile photo.', error);
    alert('Could not load that profile photo. Please try another image.');
    event.target.value = '';
  }
}

function chooseProfileAvatar(photoUrl) {
  const member = appState.currentMember;
  if (!member || !photoUrl) return;
  member.photo = photoUrl;
  const matchingMember = appState.members.find((item) => item.id === member.id);
  if (matchingMember) matchingMember.photo = photoUrl;
  saveProfilePhoto(member.id, photoUrl);
  renderProfiles();
  updateProfileUi();
  renderProfile();
}

function renderAvatarPicker(member) {
  const picker = document.getElementById('avatarPicker');
  picker.innerHTML = avatarOptions.map((option) => {
    const photoUrl = avatarOptionUrl(option);
    return `
      <button class="${member.photo === photoUrl ? 'active' : ''}" type="button" data-avatar-url="${escapeAttr(photoUrl)}" aria-label="Choose ${escapeAttr(option.seed)} avatar">
        <img src="${escapeAttr(photoUrl)}" alt="">
      </button>
    `;
  }).join('');
}

function getMemberMeals() {
  const member = appState.currentMember;
  if (!member) return [];
  return appState.meals
    .filter((meal) => !meal.member_id || meal.member_id === member.id || meal.member_name === member.name)
    .sort((a, b) => new Date(b.eaten_at || b.created_at) - new Date(a.eaten_at || a.created_at));
}

function normalizeMember(member) {
  return {
    id: member.id,
    name: member.name,
    avatar: member.avatar || '👤',
    photo: member.photo || defaultProfilePhoto(member),
    role: member.role || 'Family member'
  };
}

function avatarMarkup(member) {
  return member?.photo
    ? `<img src="${escapeAttr(member.photo)}" alt="">`
    : escapeHtml(member?.avatar || '👤');
}

function defaultProfilePhoto(member) {
  const seed = String(member.name || member.id || 'family').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const colors = {
    dad: 'd1d4f9',
    mom: 'ffd5dc',
    emily: 'ffe7a3',
    daughter: 'ffe7a3',
    james: 'd8f0c8',
    son: 'd8f0c8',
    sophia: 'e9daf6',
    grandma: 'e9daf6'
  };
  return avatarOptionUrl({ seed, color: colors[seed] || 'fff0d3' });
}

function avatarOptionUrl(option) {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(option.seed)}&backgroundColor=${option.color}`;
}

function applyStoredProfilePhotos() {
  const storedPhotos = getStoredProfilePhotos();
  appState.members = appState.members.map((member) => ({
    ...member,
    photo: storedPhotos[member.id] || member.photo || defaultProfilePhoto(member)
  }));
  if (appState.currentMember) {
    const updatedMember = appState.members.find((member) => member.id === appState.currentMember.id);
    if (updatedMember) appState.currentMember = updatedMember;
  }
}

function applyStoredAppData() {
  const storedMeals = getStoredJson(localMealsStorageKey, []).map(normalizeMeal);
  const storedChat = getStoredJson(localChatStorageKey, []).map(normalizeChat);
  const storedOrders = getStoredJson(chefOrdersStorageKey, []);
  const storedVoiceNotes = getStoredJson(chefVoiceStorageKey, []);
  if (storedMeals.length) appState.meals = mergeRecords(storedMeals, appState.meals);
  if (storedChat.length) appState.chat = mergeRecords(storedChat, appState.chat);
  if (storedOrders.length) appState.chefOrders = storedOrders;
  if (storedVoiceNotes.length) appState.voiceNotes = storedVoiceNotes;
}

function saveStoredAppData() {
  setStoredJson(localMealsStorageKey, appState.meals);
  setStoredJson(localChatStorageKey, appState.chat);
  setStoredJson(chefOrdersStorageKey, appState.chefOrders);
  setStoredJson(chefVoiceStorageKey, appState.voiceNotes);
}

function mergeRecords(primary, fallback) {
  const seen = new Set();
  return [...primary, ...fallback].filter((item) => {
    const key = item.id || `${item.member_id || item.member_name || 'family'}-${item.food_name || item.message || ''}-${item.eaten_at || item.created_at || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getStoredProfilePhotos() {
  return getStoredJson(profilePhotoStorageKey, {});
}

function saveProfilePhoto(memberId, photoUrl) {
  try {
    const storedPhotos = getStoredProfilePhotos();
    storedPhotos[memberId] = photoUrl;
    localStorage.setItem(profilePhotoStorageKey, JSON.stringify(storedPhotos));
  } catch (error) {
    console.warn('Could not save profile photo locally.', error);
    alert('Profile photo updated for this session, but the browser could not save it permanently.');
  }
}

function getStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    console.warn(`Could not read ${key}.`, error);
    return fallback;
  }
}

function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key}.`, error);
    alert('Saved for this session, but this browser could not store all data permanently. Try using a smaller photo.');
  }
}

function resizeImageFile(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(reader.error));
    reader.addEventListener('load', () => {
      const image = new Image();
      image.addEventListener('error', () => reject(new Error('Image could not be loaded.')));
      image.addEventListener('load', () => {
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      });
      image.src = String(reader.result || '');
    });
    reader.readAsDataURL(file);
  });
}

function normalizeMeal(meal) {
  return {
    ...meal,
    food_name: meal.food_name || meal.name || 'Meal',
    photo_url: meal.photo_url || '',
    eaten_at: meal.eaten_at || meal.created_at || new Date().toISOString()
  };
}

function normalizeChat(message) {
  const member = appState.members.find((item) => item.id === message.member_id);
  return {
    ...message,
    member_name: message.member_name || member?.name || 'Family',
    created_at: message.created_at || new Date().toISOString()
  };
}

function isToday(meal) {
  return new Date(meal.eaten_at || meal.created_at).toDateString() === new Date().toDateString();
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function mostCommon(values) {
  const counts = values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function numberOrNull(value) {
  return value === '' || value === null ? null : Number(value);
}

function mealEmoji(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('sushi') || lower.includes('salmon')) return '🍣';
  if (lower.includes('rice')) return '🍚';
  if (lower.includes('noodle')) return '🍜';
  if (lower.includes('fruit') || lower.includes('mango')) return '🥭';
  return '🍽️';
}

function restaurantEmoji(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('sushi')) return '🍣';
  if (lower.includes('kitchen')) return '🥘';
  return '🍽️';
}

function emptyState(message) {
  return `<article class="meal-card"><span class="meal-emoji">🍽️</span><div><h4>${message}</h4><p>FamilyBites is ready when you are.</p></div></article>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
