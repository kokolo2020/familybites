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
  ]
};

const profilePhotoStorageKey = 'familyBites.profilePhotos';

const navItems = [
  { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { page: 'snap', icon: '📷', label: 'Snap Food' },
  { page: 'favorites', icon: '❤️', label: 'Favorites' },
  { page: 'weekly', icon: '📊', label: 'Weekly Report' },
  { page: 'chat', icon: '💬', label: 'Family Chat' },
  { page: 'timeline', icon: '📅', label: 'Timeline' },
  { page: 'profile', icon: '👤', label: 'Profile' }
];

const mobileItems = navItems.filter((item) => ['dashboard', 'snap', 'favorites', 'weekly', 'chat'].includes(item.page));

document.addEventListener('DOMContentLoaded', () => {
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
  });

  document.getElementById('mealForm').addEventListener('submit', saveMeal);
  document.getElementById('chatForm').addEventListener('submit', sendChat);
  document.getElementById('mealPhoto').addEventListener('change', handlePhotoChange);
  document.getElementById('profilePhotoInput').addEventListener('change', handleProfilePhotoChange);

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
    if (meals.length) appState.meals = meals.map(normalizeMeal);
    if (favorites.length) appState.favorites = favorites;
    if (chat.length) appState.chat = chat.map(normalizeChat);
  } catch (error) {
    console.warn('Supabase unavailable, using local demo data.', error);
  }

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
  document.getElementById('orderGrid').innerHTML = cards;
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
  form.reset();
  resetPhotoPreview();
  showPage('dashboard');

  if (window.familyBitesDb?.isConfigured) {
    try {
      const savedMeal = await window.familyBitesDb.saveMeal(meal);
      appState.meals = appState.meals.map((item) => item.id === meal.id ? normalizeMeal(savedMeal) : item);
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
  input.value = '';
  renderChat();

  if (window.familyBitesDb?.isConfigured) {
    try {
      const savedMessage = await window.familyBitesDb.sendChat(message);
      appState.chat = appState.chat.map((item) => item.id === message.id ? normalizeChat(savedMessage) : item);
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

function handlePhotoChange(event) {
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

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const photoUrl = String(reader.result || '');
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.src = photoUrl;
    photoPreview.dataset.photoUrl = photoUrl;
    photoPreview.classList.remove('hidden');
    document.getElementById('photoIcon').classList.add('hidden');
    document.getElementById('photoTitle').textContent = 'Photo ready';
    document.getElementById('photoHint').textContent = 'Tap again to replace it.';
    updateMealPreview();
  });
  reader.readAsDataURL(file);
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
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${colors[seed] || 'fff0d3'}`;
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

function getStoredProfilePhotos() {
  try {
    return JSON.parse(localStorage.getItem(profilePhotoStorageKey) || '{}');
  } catch (error) {
    console.warn('Could not read saved profile photos.', error);
    return {};
  }
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
