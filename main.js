// Import components
import { 
  showLoading, 
  hideLoading, 
  showNotification, 
  toggleSidebar,
  formatDate,
  calculateDailyNutrition,
  updateNutritionProgress,
  createWeeklyChart
} from './components.js';

// Global variables
let allMeals = [];
let allProducts = [];
let currentMeal = null;
let foodLog = [];

// DOM Elements
const appLoadingOverlay = document.getElementById('app-loading-overlay');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const headerMenuBtn = document.getElementById('header-menu-btn');
const searchInput = document.getElementById('search-input');
const recipesGrid = document.getElementById('recipes-grid');
const mealDetailsSection = document.getElementById('meal-details');
const backToMealsBtn = document.getElementById('back-to-meals-btn');
const logMealBtn = document.getElementById('log-meal-btn');
const foodLogSection = document.getElementById('foodlog-section');
const productsSection = document.getElementById('products-section');
const productSearchInput = document.getElementById('product-search-input');
const searchProductBtn = document.getElementById('search-product-btn');
const barcodeInput = document.getElementById('barcode-input');
const lookupBarcodeBtn = document.getElementById('lookup-barcode-btn');
const productsGrid = document.getElementById('products-grid');
const loggedItemsList = document.getElementById('logged-items-list');
const clearFoodlogBtn = document.getElementById('clear-foodlog');
const weeklyChart = document.getElementById('weekly-chart');

// Navigation
const navLinks = document.querySelectorAll('.nav-link');
const mainContent = document.getElementById('main-content');
const header = document.getElementById('header');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Load food log from localStorage
  loadFoodLog();
  
  // Fetch initial data
  fetchMeals();
  
  // Setup event listeners
  setupEventListeners();
  
  // Hide loading overlay
  setTimeout(() => {
    hideLoading(appLoadingOverlay);
  }, 1500);
});

// Setup all event listeners
function setupEventListeners() {
  // Sidebar toggle
  headerMenuBtn.addEventListener('click', () => toggleSidebar(sidebar, sidebarOverlay));
  sidebarCloseBtn.addEventListener('click', () => toggleSidebar(sidebar, sidebarOverlay));
  sidebarOverlay.addEventListener('click', () => toggleSidebar(sidebar, sidebarOverlay));
  
  // Navigation - Determine section based on link index
  navLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Determine which section to navigate to based on link index
      let targetSection;
      if (index === 0) targetSection = 'meals';
      else if (index === 1) targetSection = 'scanner';
      else if (index === 2) targetSection = 'foodlog';
      
      navigateToSection(targetSection);
      
      // Update active nav state
      navLinks.forEach(l => l.classList.remove('bg-emerald-50', 'text-emerald-700'));
      link.classList.add('bg-emerald-50', 'text-emerald-700');
    });
  });
  
  // Search functionality
  searchInput.addEventListener('input', debounce(filterMeals, 300));
  
  // Back button
  backToMealsBtn.addEventListener('click', () => {
    mealDetailsSection.style.display = 'none';
    document.getElementById('all-recipes-section').style.display = 'block';
  });
  
  // Log meal button
  logMealBtn.addEventListener('click', () => {
    if (currentMeal) {
      logMeal(currentMeal);
      showNotification('Meal logged successfully!', 'success');
    }
  });
  
  // Product search
  searchProductBtn.addEventListener('click', searchProducts);
  productSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchProducts();
  });
  
  // Barcode lookup
  lookupBarcodeBtn.addEventListener('click', lookupBarcode);
  barcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') lookupBarcode();
  });
  
  // Clear food log
  clearFoodlogBtn.addEventListener('click', clearFoodLog);
  
  // Category filters
  const categoryButtons = document.querySelectorAll('.category-card');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-category');
      filterMealsByCategory(category);
    });
  });
  
  // Product category filters
  const productCategoryButtons = document.querySelectorAll('.product-category-btn');
  productCategoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.textContent.trim();
      filterProductsByCategory(category);
    });
  });
  
  // Nutri-score filters
  const nutriScoreFilters = document.querySelectorAll('.nutri-score-filter');
  nutriScoreFilters.forEach(button => {
    button.addEventListener('click', () => {
      const grade = button.getAttribute('data-grade');
      filterProductsByNutriScore(grade);
      
      // Update active state
      nutriScoreFilters.forEach(f => {
        f.classList.remove('bg-emerald-600', 'text-white');
      });
      button.classList.add('bg-emerald-600', 'text-white');
    });
  });
  
  // Quick action buttons in food log
  const quickLogBtns = document.querySelectorAll('.quick-log-btn');
  quickLogBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      if (index === 0) { // Log a Meal
        navigateToSection('meals');
        navLinks.forEach(l => l.classList.remove('bg-emerald-50', 'text-emerald-700'));
        navLinks[0].classList.add('bg-emerald-50', 'text-emerald-700');
      } else if (index === 1) { // Scan Product
        navigateToSection('scanner');
        navLinks.forEach(l => l.classList.remove('bg-emerald-50', 'text-emerald-700'));
        navLinks[1].classList.add('bg-emerald-50', 'text-emerald-700');
      } else if (index === 2) { // Custom Entry
        showNotification('Custom entry feature coming soon!', 'info');
      }
    });
  });
}

// Navigate to different sections
function navigateToSection(section) {
  // Hide all sections
  document.getElementById('all-recipes-section').style.display = 'none';
  mealDetailsSection.style.display = 'none';
  foodLogSection.style.display = 'none';
  productsSection.style.display = 'none';
  
  // Show selected section
  switch(section) {
    case 'meals':
      document.getElementById('all-recipes-section').style.display = 'block';
      header.querySelector('h1').textContent = 'Meals & Recipes';
      header.querySelector('p').textContent = 'Discover delicious and nutritious recipes tailored for you';
      break;
    case 'scanner':
      productsSection.style.display = 'block';
      header.querySelector('h1').textContent = 'Product Scanner';
      header.querySelector('p').textContent = 'Scan products to track your nutrition';
      break;
    case 'foodlog':
      foodLogSection.style.display = 'block';
      header.querySelector('h1').textContent = 'Food Log';
      header.querySelector('p').textContent = 'Track and monitor your daily nutrition intake';
      updateFoodLogDisplay();
      updateWeeklyChart();
      break;
  }
}

// Fetch meals from API
async function fetchMeals() {
  try {
    showLoading();
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
    const data = await response.json();
    
    if (data.meals) {
      // Limit to 25 meals as requested
      allMeals = data.meals.slice(0, 25);
      displayMeals(allMeals);
      loadCategories(allMeals);
    }
  } catch (error) {
    console.error('Error fetching meals:', error);
    showNotification('Failed to load meals. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// Display meals in the grid
function displayMeals(meals) {
  recipesGrid.innerHTML = '';
  
  meals.forEach(meal => {
    const mealCard = document.createElement('div');
    mealCard.className = 'recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group';
    mealCard.setAttribute('data-meal-id', meal.idMeal);
    
    const category = meal.strCategory || 'General';
    const area = meal.strArea || 'International';
    
    mealCard.innerHTML = `
      <div class="relative h-48 overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
             src="${meal.strMealThumb}" 
             alt="${meal.strMeal}" 
             loading="lazy" />
        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            ${category}
          </span>
          <span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">
            ${area}
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
          ${meal.strMeal}
        </h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">
          ${meal.strInstructions ? meal.strInstructions.substring(0, 100) + '...' : 'Delicious recipe to try!'}
        </p>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-gray-900">
            <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
            ${category}
          </span>
          <span class="font-semibold text-gray-500">
            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
            ${area}
          </span>
        </div>
      </div>
    `;
    
    mealCard.addEventListener('click', () => showMealDetails(meal.idMeal));
    recipesGrid.appendChild(mealCard);
  });
  
  document.getElementById('recipes-count').textContent = `Showing ${meals.length} recipes`;
}

// Load and display categories
function loadCategories(meals) {
  const categoriesGrid = document.getElementById('categories-grid');
  categoriesGrid.innerHTML = '';
  
  const categories = [...new Set(meals.map(meal => meal.strCategory || 'General'))];
  
  categories.forEach(category => {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group';
    categoryCard.setAttribute('data-category', category);
    
    let icon = 'fa-utensils';
    if (category.toLowerCase().includes('beef')) icon = 'fa-drumstick-bite';
    else if (category.toLowerCase().includes('chicken')) icon = 'fa-drumstick-bite';
    else if (category.toLowerCase().includes('pork')) icon = 'fa-bacon';
    else if (category.toLowerCase().includes('seafood')) icon = 'fa-fish';
    else if (category.toLowerCase().includes('vegetarian')) icon = 'fa-leaf';
    else if (category.toLowerCase().includes('dessert')) icon = 'fa-ice-cream';
    else if (category.toLowerCase().includes('breakfast')) icon = 'fa-egg';
    
    categoryCard.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="text-white w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900">${category}</h3>
        </div>
      </div>
    `;
    
    categoryCard.addEventListener('click', () => filterMealsByCategory(category));
    categoriesGrid.appendChild(categoryCard);
  });
}

// Filter meals by category
function filterMealsByCategory(category) {
  const filteredMeals = allMeals.filter(meal => 
    (meal.strCategory || 'General') === category
  );
  
  displayMeals(filteredMeals);
  
  const filterButtons = document.querySelectorAll('#search-filters-section button');
  filterButtons.forEach(btn => {
    btn.classList.remove('bg-emerald-600', 'text-white');
    btn.classList.add('bg-gray-100', 'text-gray-700');
  });
  
  const activeButton = Array.from(filterButtons).find(btn => 
    btn.textContent.trim() === category || (category === 'General' && btn.textContent.trim() === 'All Recipes')
  );
  
  if (activeButton) {
    activeButton.classList.remove('bg-gray-100', 'text-gray-700');
    activeButton.classList.add('bg-emerald-600', 'text-white');
  }
}

// Filter meals based on search input
function filterMeals() {
  const searchTerm = searchInput.value.toLowerCase();
  
  if (!searchTerm) {
    displayMeals(allMeals);
    return;
  }
  
  const filteredMeals = allMeals.filter(meal => 
    meal.strMeal.toLowerCase().includes(searchTerm) ||
    (meal.strCategory && meal.strCategory.toLowerCase().includes(searchTerm)) ||
    (meal.strArea && meal.strArea.toLowerCase().includes(searchTerm))
  );
  
  displayMeals(filteredMeals);
}

// Show meal details
async function showMealDetails(mealId) {
  try {
    showLoading();
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    const data = await response.json();
    
    if (data.meals && data.meals.length > 0) {
      currentMeal = data.meals[0];
      displayMealDetails(currentMeal);
      
      document.getElementById('all-recipes-section').style.display = 'none';
      mealDetailsSection.style.display = 'block';
      
      window.scrollTo(0, 0);
    }
  } catch (error) {
    console.error('Error fetching meal details:', error);
    showNotification('Failed to load meal details. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// Display meal details
function displayMealDetails(meal) {
  document.querySelector('#meal-details img').src = meal.strMealThumb;
  document.querySelector('#meal-details img').alt = meal.strMeal;
  document.querySelector('#meal-details h1').textContent = meal.strMeal;
  
  const tagsContainer = document.querySelector('#meal-details .flex.items-center.gap-3.mb-3');
  tagsContainer.innerHTML = '';
  
  const category = meal.strCategory || 'General';
  const area = meal.strArea || 'International';
  
  const categoryTag = document.createElement('span');
  categoryTag.className = 'px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full';
  categoryTag.textContent = category;
  tagsContainer.appendChild(categoryTag);
  
  const areaTag = document.createElement('span');
  areaTag.className = 'px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full';
  areaTag.textContent = area;
  tagsContainer.appendChild(areaTag);
  
  logMealBtn.setAttribute('data-meal-id', meal.idMeal);
  
  const ingredientsContainer = document.querySelector('#meal-details .grid.grid-cols-1.md\\:grid-cols-2.gap-3');
  ingredientsContainer.innerHTML = '';
  
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient,
        measure: measure || ''
      });
    }
  }
  
  document.querySelector('#meal-details .text-sm.font-normal.text-gray-500.ml-auto').textContent = `${ingredients.length} items`;
  
  ingredients.forEach(ingredient => {
    const ingredientDiv = document.createElement('div');
    ingredientDiv.className = 'flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors';
    
    ingredientDiv.innerHTML = `
      <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
      <span class="text-gray-700">
        <span class="font-medium text-gray-900">${ingredient.measure}</span>
        ${ingredient.name}
      </span>
    `;
    
    ingredientsContainer.appendChild(ingredientDiv);
  });
  
  const instructionsContainer = document.querySelector('#meal-details .space-y-4');
  instructionsContainer.innerHTML = '';
  
  const instructions = meal.strInstructions.split('\r\n').filter(step => step.trim());
  
  instructions.forEach((step, index) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors';
    
    stepDiv.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
        ${index + 1}
      </div>
      <p class="text-gray-700 leading-relaxed pt-2">${step}</p>
    `;
    
    instructionsContainer.appendChild(stepDiv);
  });
  
  const videoContainer = document.querySelector('#meal-details iframe');
  if (meal.strYoutube) {
    const videoId = meal.strYoutube.split('v=')[1]?.split('&')[0];
    if (videoId) {
      videoContainer.src = `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  generateNutritionData(meal);
}

// Generate mock nutrition data
function generateNutritionData(meal) {
  const calories = Math.floor(Math.random() * 400) + 300;
  const protein = Math.floor(Math.random() * 30) + 15;
  const carbs = Math.floor(Math.random() * 40) + 20;
  const fat = Math.floor(Math.random() * 20) + 5;
  const fiber = Math.floor(Math.random() * 10) + 2;
  const sugar = Math.floor(Math.random() * 20) + 5;
  
  document.querySelector('#hero-calories').textContent = `${calories} cal/serving`;
  document.querySelector('#nutrition-facts-container .text-4xl').textContent = calories;
  document.querySelector('#nutrition-facts-container .text-xs.text-gray-500.mt-1').textContent = `Total: ${calories * 4} cal`;
  
  const nutritionBars = document.querySelectorAll('#nutrition-facts-container .space-y-4 > div');
  
  nutritionBars[0].querySelector('.font-bold').textContent = `${protein}g`;
  nutritionBars[1].querySelector('.bg-emerald-500').style.width = `${Math.min(100, (protein / 50) * 100)}%`;
  
  nutritionBars[2].querySelector('.font-bold').textContent = `${carbs}g`;
  nutritionBars[3].querySelector('.bg-blue-500').style.width = `${Math.min(100, (carbs / 250) * 100)}%`;
  
  nutritionBars[4].querySelector('.font-bold').textContent = `${fat}g`;
  nutritionBars[5].querySelector('.bg-purple-500').style.width = `${Math.min(100, (fat / 65) * 100)}%`;
  
  nutritionBars[6].querySelector('.font-bold').textContent = `${fiber}g`;
  nutritionBars[7].querySelector('.bg-orange-500').style.width = `${Math.min(100, (fiber / 25) * 100)}%`;
  
  nutritionBars[8].querySelector('.font-bold').textContent = `${sugar}g`;
  nutritionBars[9].querySelector('.bg-pink-500').style.width = `${Math.min(100, (sugar / 50) * 100)}%`;
  
  currentMeal.nutrition = {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar
  };
}

// Search products
async function searchProducts() {
  const searchTerm = productSearchInput.value.trim();
  
  if (!searchTerm) {
    showNotification('Please enter a product name', 'warning');
    return;
  }
  
  try {
    showLoading();
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=20`);
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      allProducts = data.products;
      displayProducts(allProducts);
      document.getElementById('products-count').textContent = `Found ${allProducts.length} products`;
    } else {
      productsGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fa-solid fa-search text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium">No products found</p>
          <p class="text-gray-400 text-sm">Try a different search term</p>
        </div>
      `;
      document.getElementById('products-count').textContent = 'No products found';
    }
  } catch (error) {
    console.error('Error searching products:', error);
    showNotification('Failed to search products. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// Lookup product by barcode
async function lookupBarcode() {
  const barcode = barcodeInput.value.trim();
  
  if (!barcode) {
    showNotification('Please enter a barcode number', 'warning');
    return;
  }
  
  try {
    showLoading();
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      allProducts = [data.product];
      displayProducts(allProducts);
      document.getElementById('products-count').textContent = `Found 1 product`;
    } else {
      productsGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fa-solid fa-barcode text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium">No product found with this barcode</p>
          <p class="text-gray-400 text-sm">Check the barcode and try again</p>
        </div>
      `;
      document.getElementById('products-count').textContent = 'No product found';
    }
  } catch (error) {
    console.error('Error looking up barcode:', error);
    showNotification('Failed to lookup barcode. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// Display products in the grid
function displayProducts(products) {
  productsGrid.innerHTML = '';
  
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group';
    productCard.setAttribute('data-barcode', product.code);
    
    const imageUrl = product.image_front_url || 'https://via.placeholder.com/300x200?text=No+Image';
    const nutritionData = product.nutriments || {};
    const calories = nutritionData['energy-kcal_100g'] || 0;
    const protein = nutritionData.proteins_100g || 0;
    const carbs = nutritionData.carbohydrates_100g || 0;
    const fat = nutritionData.fat_100g || 0;
    const sugar = nutritionData.sugars_100g || 0;
    
    const nutriScore = product.nutrition_grades || 'unknown';
    let nutriScoreClass = 'bg-gray-500';
    if (nutriScore === 'a') nutriScoreClass = 'bg-green-500';
    else if (nutriScore === 'b') nutriScoreClass = 'bg-lime-500';
    else if (nutriScore === 'c') nutriScoreClass = 'bg-yellow-500';
    else if (nutriScore === 'd') nutriScoreClass = 'bg-orange-500';
    else if (nutriScore === 'e') nutriScoreClass = 'bg-red-500';
    
    const novaGroup = product.nova_group || 1;
    let novaClass = 'bg-green-500';
    if (novaGroup === 3) novaClass = 'bg-yellow-500';
    else if (novaGroup === 4) novaClass = 'bg-red-500';
    
    const productName = product.product_name || 'Unknown Product';
    const brandName = product.brands || 'Unknown Brand';
    const quantity = product.quantity || product.serving_size || '100g';
    
    productCard.innerHTML = `
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
             src="${imageUrl}" 
             alt="${productName}" 
             loading="lazy" />
        <div class="absolute top-2 left-2 ${nutriScoreClass} text-white text-xs font-bold px-2 py-1 rounded uppercase">
          Nutri-Score ${nutriScore.toUpperCase()}
        </div>
        <div class="absolute top-2 right-2 ${novaClass} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${novaGroup}">
          ${novaGroup}
        </div>
      </div>
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${brandName}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          ${productName}
        </h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span><i class="fa-solid fa-weight-scale mr-1"></i>${quantity}</span>
          <span><i class="fa-solid fa-fire mr-1"></i>${calories} kcal/100g</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5">
            <p class="text-xs font-bold text-emerald-700">${protein}g</p>
            <p class="text-[10px] text-gray-500">Protein</p>
          </div>
          <div class="bg-blue-50 rounded p-1.5">
            <p class="text-xs font-bold text-blue-700">${carbs}g</p>
            <p class="text-[10px] text-gray-500">Carbs</p>
          </div>
          <div class="bg-purple-50 rounded p-1.5">
            <p class="text-xs font-bold text-purple-700">${fat}g</p>
            <p class="text-[10px] text-gray-500">Fat</p>
          </div>
          <div class="bg-orange-50 rounded p-1.5">
            <p class="text-xs font-bold text-orange-700">${sugar}g</p>
            <p class="text-[10px] text-gray-500">Sugar</p>
          </div>
        </div>
      </div>
    `;
    
    productCard.addEventListener('click', () => logProduct(product));
    productsGrid.appendChild(productCard);
  });
}

// Filter products by category
function filterProductsByCategory(category) {
  showNotification(`Filtering by ${category}`, 'info');
}

// Filter products by Nutri-Score
function filterProductsByNutriScore(grade) {
  if (!grade) {
    displayProducts(allProducts);
    return;
  }
  
  const filteredProducts = allProducts.filter(product => 
    (product.nutrition_grades || '').toLowerCase() === grade
  );
  
  displayProducts(filteredProducts);
  document.getElementById('products-count').textContent = `Found ${filteredProducts.length} products with Nutri-Score ${grade.toUpperCase()}`;
}

// Log a meal to the food log
function logMeal(meal) {
  if (!meal || !meal.nutrition) return;
  
  const logEntry = {
    id: Date.now(),
    type: 'meal',
    name: meal.strMeal,
    image: meal.strMealThumb,
    nutrition: meal.nutrition,
    date: new Date().toISOString()
  };
  
  foodLog.push(logEntry);
  saveFoodLog();
  updateFoodLogDisplay();
}

// Log a product to the food log
function logProduct(product) {
  const nutritionData = product.nutriments || {};
  
  const logEntry = {
    id: Date.now(),
    type: 'product',
    name: product.product_name || 'Unknown Product',
    brand: product.brands || 'Unknown Brand',
    image: product.image_front_url || 'https://via.placeholder.com/300x200?text=No+Image',
    quantity: product.quantity || product.serving_size || '100g',
    nutrition: {
      calories: nutritionData['energy-kcal_100g'] || 0,
      protein: nutritionData.proteins_100g || 0,
      carbs: nutritionData.carbohydrates_100g || 0,
      fat: nutritionData.fat_100g || 0,
      fiber: nutritionData.fiber_100g || 0,
      sugar: nutritionData.sugars_100g || 0
    },
    date: new Date().toISOString()
  };
  
  foodLog.push(logEntry);
  saveFoodLog();
  updateFoodLogDisplay();
  
  showNotification('Product logged successfully!', 'success');
}

// Load food log from localStorage
function loadFoodLog() {
  const savedLog = localStorage.getItem('nutriplan-foodlog');
  if (savedLog) {
    foodLog = JSON.parse(savedLog);
  }
}

// Save food log to localStorage
function saveFoodLog() {
  localStorage.setItem('nutriplan-foodlog', JSON.stringify(foodLog));
}

// Update food log display
function updateFoodLogDisplay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEntries = foodLog.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  document.getElementById('foodlog-date').textContent = today.toLocaleDateString('en-US', options);
  
  const dailyNutrition = calculateDailyNutrition(todayEntries);
  updateNutritionProgress(dailyNutrition);
  
  if (todayEntries.length === 0) {
    loggedItemsList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
        <p class="font-medium">No meals logged today</p>
        <p class="text-sm">Add meals from the Meals page or scan products</p>
      </div>
    `;
    clearFoodlogBtn.style.display = 'none';
  } else {
    loggedItemsList.innerHTML = '';
    clearFoodlogBtn.style.display = 'block';
    
    todayEntries.forEach(entry => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
      
      itemDiv.innerHTML = `
        <img src="${entry.image}" alt="${entry.name}" class="w-12 h-12 rounded-lg object-cover">
        <div class="flex-1">
          <h4 class="font-medium text-gray-900">${entry.name}</h4>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span><i class="fa-solid fa-fire mr-1"></i>${entry.nutrition.calories} kcal</span>
            <span><i class="fa-solid fa-dumbbell mr-1"></i>P: ${entry.nutrition.protein}g</span>
            <span><i class="fa-solid fa-bread-slice mr-1"></i>C: ${entry.nutrition.carbs}g</span>
            <span><i class="fa-solid fa-oil-can mr-1"></i>F: ${entry.nutrition.fat}g</span>
          </div>
        </div>
        <button class="remove-log-item text-red-500 hover:text-red-600" data-id="${entry.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      
      loggedItemsList.appendChild(itemDiv);
    });
    
    document.querySelectorAll('.remove-log-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        removeLogItem(id);
      });
    });
  }
}

// Remove an item from the food log
function removeLogItem(id) {
  foodLog = foodLog.filter(entry => entry.id !== id);
  saveFoodLog();
  updateFoodLogDisplay();
  showNotification('Item removed from food log', 'info');
}

// Clear all items from today's food log
function clearFoodLog() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  foodLog = foodLog.filter(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() !== today.getTime();
  });
  
  saveFoodLog();
  updateFoodLogDisplay();
  showNotification('Today\'s food log cleared', 'info');
}

// Update weekly chart
function updateWeeklyChart() {
  const weekData = [];
  const labels = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayEntries = foodLog.filter(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === date.getTime();
    });
    
    const dayNutrition = calculateDailyNutrition(dayEntries);
    
    weekData.push({
      calories: dayNutrition.calories,
      protein: dayNutrition.protein,
      carbs: dayNutrition.carbs,
      fat: dayNutrition.fat
    });
    
    const options = { weekday: 'short' };
    labels.push(date.toLocaleDateString('en-US', options));
  }
  
  createWeeklyChart(weeklyChart, labels, weekData);
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}